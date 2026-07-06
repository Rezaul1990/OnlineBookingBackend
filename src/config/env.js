import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000"
};
