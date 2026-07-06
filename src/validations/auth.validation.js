const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginSchema = (body) => {
  const errors = {};
  const data = {
    email: String(body.email || "").trim().toLowerCase(),
    password: String(body.password || "")
  };

  if (!emailPattern.test(data.email)) errors.email = "A valid email address is required.";
  if (data.password.length < 8) errors.password = "Password must be at least 8 characters.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data
  };
};
