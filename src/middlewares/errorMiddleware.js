const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && isProduction ? "Internal server error" : error.message,
    ...(isProduction ? {} : { stack: error.stack })
  });
};

module.exports = {
  notFound,
  errorHandler
};

