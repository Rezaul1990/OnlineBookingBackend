import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDatabase = async () => {
  if (!env.mongodbUri) {
    console.warn("MONGODB_URI is not set. Database-backed routes will fail until configured.");
    return;
  }

  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
};
