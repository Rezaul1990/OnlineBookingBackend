import mongoose from "mongoose";
import { AppError } from "./AppError.js";

export const ensureDatabaseReady = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError("Database is not configured. Set MONGODB_URI in backend/.env.", 503);
  }
};
