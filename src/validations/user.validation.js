const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createUserSchema = (body) => {
  const errors = {};
  const data = {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    roleId: String(body.roleId || "").trim(),
    status: "invited"
  };

  if (data.name.length < 2) errors.name = "Name must be at least 2 characters.";
  if (!emailPattern.test(data.email)) errors.email = "A valid email address is required.";
  if (!data.roleId) errors.roleId = "Role is required.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data
  };
};

export const updateUserSchema = (body) => {
  const errors = {};
  const data = {
    name: body.name == null ? undefined : String(body.name).trim(),
    password: body.password ? String(body.password) : undefined,
    roleId: body.roleId == null ? undefined : String(body.roleId).trim(),
    status: body.status == null ? undefined : String(body.status).trim()
  };

  if (data.name !== undefined && data.name.length < 2) errors.name = "Name must be at least 2 characters.";
  if (data.password !== undefined && data.password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (data.status !== undefined && !["invited", "active", "inactive", "suspended"].includes(data.status)) errors.status = "Invalid user status.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data
  };
};

export const setupPasswordSchema = (body) => {
  const errors = {};
  const data = {
    token: String(body.token || "").trim(),
    password: String(body.password || "")
  };

  if (data.token.length < 40) errors.token = "A valid setup token is required.";
  if (data.password.length < 8) errors.password = "Password must be at least 8 characters.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data
  };
};
