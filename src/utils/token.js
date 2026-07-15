import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAuthToken = (user) => {
  return jwt.sign({ sub: user._id.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
};

export const verifyAuthToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

export const authCookieOptions = () => ({
  httpOnly: true,
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  secure: env.nodeEnv === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
});
