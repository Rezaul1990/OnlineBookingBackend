import { getCurrentUserById, serializeUser } from "../services/auth.service.js";
import { AppError } from "../utils/AppError.js";
import { verifyAuthToken } from "../utils/token.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const token = req.cookies?.admin_token || bearerToken;

    if (!token) {
      throw new AppError("Authentication required.", 401);
    }

    const payload = verifyAuthToken(token);
    const user = await getCurrentUserById(payload.sub);

    req.user = user;
    req.authUser = serializeUser(user);
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new AppError("Authentication required.", 401));
    }

    return next(error);
  }
};

export const requirePermission = (permissionKey) => (req, res, next) => {
  const permissions = req.authUser?.role?.permissions || [];

  if (req.authUser?.role?.slug === "owner" || permissions.includes(permissionKey)) {
    return next();
  }

  return next(new AppError("You do not have permission to access this resource.", 403));
};
