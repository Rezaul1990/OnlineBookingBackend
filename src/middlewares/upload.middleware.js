import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

if (env.cloudinaryUrl) {
  cloudinary.config(true);
  cloudinary.config({ secure: true });
}

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
  limits: { fileSize: 5 * 1024 * 1024 }
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
        unique_filename: true
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          const cloudinaryMessage = error?.message || "";
          if (cloudinaryMessage) console.error("Cloudinary image upload failed:", cloudinaryMessage);
          const message = /invalid signature|must supply api_key|api key|api_secret/i.test(cloudinaryMessage)
            ? "Cloudinary rejected the upload. Check the backend CLOUDINARY_URL API key and secret."
            : "Unable to upload image.";
          reject(new AppError(message, 502));
          return;
        }
        resolve(result.secure_url);
      }
    );

    stream.end(req.file.buffer);
  });
};
