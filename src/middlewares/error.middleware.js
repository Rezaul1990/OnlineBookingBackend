import { errorResponse } from "../utils/apiResponse.js";

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let message = statusCode === 500 ? "Internal server error" : error.message;

  if (error.name === "MulterError") {
    statusCode = 400;
    message = error.code === "LIMIT_FILE_SIZE" ? "Image size must be 5 MB or less." : "Invalid image upload.";
  }

  if (statusCode === 500 && process.env.NODE_ENV !== "test") {
    console.error(error);
  }

  return errorResponse(res, {
    statusCode,
    message,
    errors: error.errors || null
  });
};
