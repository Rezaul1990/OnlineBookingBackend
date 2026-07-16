import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

if (env.cloudinaryUrl) cloudinary.config({ secure: true });

const storage = multer.memoryStorage();

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

export const uploadToCloudinary = (req, folder = "onlinebooking") => {
  if (!req.file) return "";
  if (!env.cloudinaryUrl) {
    throw new AppError("Cloudinary storage is not configured.", 500);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        overwrite: false,
        transformation: [{ quality: "auto", fetch_format: "auto" }]
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(new AppError("Unable to upload image.", 502));
          return;
        }
        resolve(result.secure_url);
      }
    );

    stream.end(req.file.buffer);
  });
};
