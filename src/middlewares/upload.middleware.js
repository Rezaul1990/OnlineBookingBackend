import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { AppError } from "../utils/AppError.js";

const uploadDir = process.env.VERCEL ? "/tmp/uploads" : path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDir),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  }
});

const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype.startsWith("image/")) {
    callback(new AppError("Only image uploads are allowed.", 400));
    return;
  }

  callback(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

export const buildUploadedImageUrl = (req) => {
  if (!req.file) return "";
  return `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
};
