import { allPermissionKeys, permissions, permissionModules } from "../constants/permissions.js";
import { Role } from "../models/role.model.js";
import { AppError } from "../utils/AppError.js";
import { ensureDatabaseReady } from "../utils/databaseReady.js";
import { slugify } from "../utils/slugify.js";
import { createAuditLog } from "./audit.service.js";

export const getPermissionRegistry = () => ({
  permissions,
  groups: permissionModules
});

export const sanitizePermissions = (requestedPermissions = []) => {
  const allowed = new Set(allPermissionKeys);
  return [...new Set(requestedPermissions)].filter((permission) => allowed.has(permission));
};

export const ensureSystemRoles = async () => {
  ensureDatabaseReady();

  const ownerRole = await Role.findOneAndUpdate(
    { slug: "owner" },
    {
      name: "Owner",
      slug: "owner",
      description: "Full system owner access.",
      permissions: allPermissionKeys,
      isSystemRole: true
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Role.findOneAndUpdate(
    { slug: "admin" },
    {
      name: "Admin",
      slug: "admin",
      description: "Administrative access without owner-only role management by default.",
      permissions: ["dashboard.view", "bookings.view", "bookings.create", "bookings.update", "bookings.manage", "reports.view"],
      isSystemRole: true
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await Role.findOneAndUpdate(
    { slug: "staff" },
    {
      name: "Staff",
      slug: "staff",
      description: "Staff access for daily booking operations.",
      permissions: ["dashboard.view", "bookings.view", "bookings.update"],
      isSystemRole: true
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  return ownerRole;
};

export const listRoles = async () => {
  ensureDatabaseReady();
  await ensureSystemRoles();
  return Role.find().sort({ isSystemRole: -1, name: 1 });
};

export const createRole = async ({ req, actorId, payload }) => {
  ensureDatabaseReady();
  const slug = slugify(payload.slug || payload.name);

  if (!slug) {
    throw new AppError("A valid role name is required.", 400);
  }

  const existing = await Role.findOne({ slug });
  if (existing) {
    throw new AppError("A role with this name already exists.", 409);
  }

  const role = await Role.create({
    name: payload.name,
    slug,
    description: payload.description || "",
    permissions: sanitizePermissions(payload.permissions),
    isSystemRole: false,
    createdBy: actorId,
    updatedBy: actorId
  });

  await createAuditLog({ req, actorId, action: "role.created", module: "roles", targetType: "Role", targetId: role._id, newValue: role.toObject() });
  return role;
};

export const updateRole = async ({ req, actorId, roleId, payload }) => {
  ensureDatabaseReady();
  const role = await Role.findById(roleId);

  if (!role) {
    throw new AppError("Role not found.", 404);
  }

  if (role.slug === "owner" && payload.permissions && payload.permissions.length !== allPermissionKeys.length) {
    throw new AppError("Owner role must keep all permissions.", 400);
  }

  const oldValue = role.toObject();
  role.name = payload.name ?? role.name;
  role.description = payload.description ?? role.description;
  role.permissions = payload.permissions ? sanitizePermissions(payload.permissions) : role.permissions;
  role.updatedBy = actorId;
  await role.save();

  await createAuditLog({ req, actorId, action: "role.updated", module: "roles", targetType: "Role", targetId: role._id, oldValue, newValue: role.toObject() });
  return role;
};

export const deleteRole = async ({ req, actorId, roleId }) => {
  ensureDatabaseReady();
  const role = await Role.findById(roleId);

  if (!role) {
    throw new AppError("Role not found.", 404);
  }

  if (role.isSystemRole) {
    throw new AppError("System roles cannot be deleted.", 400);
  }

  await role.deleteOne();
  await createAuditLog({ req, actorId, action: "role.deleted", module: "roles", targetType: "Role", targetId: role._id, oldValue: role.toObject() });
};
