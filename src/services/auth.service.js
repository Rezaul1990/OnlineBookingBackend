import bcrypt from "bcryptjs";
import { Role } from "../models/role.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";
import { ensureDatabaseReady } from "../utils/databaseReady.js";
import { signAuthToken } from "../utils/token.js";
import { ensureSystemRoles } from "./role.service.js";

export const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  status: user.status,
  role: user.roleId
    ? {
        id: user.roleId._id.toString(),
        name: user.roleId.name,
        slug: user.roleId.slug,
        permissions: user.roleId.permissions || []
      }
    : null
});

export const loginAdmin = async ({ email, password }) => {
  ensureDatabaseReady();
  await ensureSystemRoles();

  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).populate("roleId");
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.status !== "active") {
    throw new AppError("This account is not active.", 403);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signAuthToken(user),
    user: serializeUser(user)
  };
};

export const getCurrentUserById = async (userId) => {
  ensureDatabaseReady();
  const user = await User.findById(userId).populate("roleId");

  if (!user || user.status !== "active") {
    throw new AppError("Authentication required.", 401);
  }

  return user;
};

export const createOwnerFromEnv = async ({ name, email, password }) => {
  ensureDatabaseReady();

  if (!name || !email || !password) {
    throw new AppError("OWNER_NAME, OWNER_EMAIL, and OWNER_PASSWORD are required.", 400);
  }

  const ownerRole = await ensureSystemRoles();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    existing.roleId = ownerRole._id;
    existing.status = "active";
    await existing.save();
    return { user: existing, created: false };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    roleId: ownerRole._id,
    status: "active"
  });

  return { user, created: true };
};

export const countOwnerUsers = async () => {
  ensureDatabaseReady();
  const ownerRole = await Role.findOne({ slug: "owner" });
  if (!ownerRole) return 0;
  return User.countDocuments({ roleId: ownerRole._id, status: "active" });
};
