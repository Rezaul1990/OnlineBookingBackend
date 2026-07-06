import bcrypt from "bcryptjs";
import { Role } from "../models/role.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import { ensureDatabaseReady } from "../utils/databaseReady.js";
import { createAuditLog } from "./audit.service.js";
import { ensureSystemRoles } from "./role.service.js";

export const listUsers = async () => {
  ensureDatabaseReady();
  await ensureSystemRoles();
  return User.find().populate("roleId").sort({ createdAt: -1 }).select("-passwordHash");
};

export const createUser = async ({ req, actorId, payload }) => {
  ensureDatabaseReady();
  await ensureSystemRoles();

  const role = await Role.findById(payload.roleId);
  if (!role) {
    throw new AppError("Selected role was not found.", 400);
  }

  const email = String(payload.email || "").trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("A user with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    name: payload.name,
    email,
    passwordHash,
    roleId: role._id,
    status: payload.status || "active",
    createdBy: actorId,
    updatedBy: actorId
  });

  await createAuditLog({ req, actorId, action: "user.created", module: "staff", targetType: "User", targetId: user._id, newValue: { name: user.name, email: user.email, roleId: user.roleId, status: user.status } });
  return User.findById(user._id).populate("roleId").select("-passwordHash");
};

export const updateUser = async ({ req, actorId, userId, payload }) => {
  ensureDatabaseReady();
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const oldValue = { name: user.name, email: user.email, roleId: user.roleId, status: user.status };

  if (payload.roleId) {
    const role = await Role.findById(payload.roleId);
    if (!role) {
      throw new AppError("Selected role was not found.", 400);
    }
    user.roleId = role._id;
  }

  user.name = payload.name ?? user.name;
  user.status = payload.status ?? user.status;
  user.updatedBy = actorId;

  if (payload.password) {
    user.passwordHash = await bcrypt.hash(payload.password, 12);
  }

  await user.save();

  await createAuditLog({ req, actorId, action: "user.updated", module: "staff", targetType: "User", targetId: user._id, oldValue, newValue: { name: user.name, email: user.email, roleId: user.roleId, status: user.status } });
  return User.findById(user._id).populate("roleId").select("-passwordHash");
};
