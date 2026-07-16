import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "change_this_jwt_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  businessTimeZone: process.env.BUSINESS_TIME_ZONE || "Asia/Dhaka",
  cloudinaryUrl: process.env.CLOUDINARY_URL || "",
  ownerName: process.env.OWNER_NAME || "",
  ownerEmail: process.env.OWNER_EMAIL || "",
  ownerPassword: process.env.OWNER_PASSWORD || ""
};
