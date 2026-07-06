export const roleSchema = (body) => {
  const errors = {};
  const data = {
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    permissions: Array.isArray(body.permissions) ? body.permissions.map(String) : []
  };

  if (data.name.length < 2) errors.name = "Role name must be at least 2 characters.";
  if (data.description.length > 300) errors.description = "Description cannot exceed 300 characters.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data
  };
};
