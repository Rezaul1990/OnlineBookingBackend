import { AppError } from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema(req.body);

  if (!result.valid) {
    return next(new AppError("Validation failed", 400, result.errors));
  }

  req.body = result.data;
  return next();
};
