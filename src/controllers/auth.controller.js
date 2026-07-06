import { loginAdmin, serializeUser } from "../services/auth.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { authCookieOptions } from "../utils/token.js";

export const login = async (req, res, next) => {
  try {
    const { token, user } = await loginAdmin(req.body);
    res.cookie("admin_token", token, authCookieOptions());
    return successResponse(res, {
      message: "Login successful",
      data: { user }
    });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie("admin_token", authCookieOptions());
  return successResponse(res, {
    message: "Logged out successfully",
    data: null
  });
};

export const me = async (req, res) => {
  return successResponse(res, {
    message: "Current user retrieved successfully",
    data: { user: serializeUser(req.user) }
  });
};
