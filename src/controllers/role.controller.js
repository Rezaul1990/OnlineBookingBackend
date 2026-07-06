import { createRole, deleteRole, getPermissionRegistry, listRoles, updateRole } from "../services/role.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const getPermissions = async (req, res) => {
  return successResponse(res, {
    message: "Permissions retrieved successfully",
    data: getPermissionRegistry()
  });
};

export const getRoles = async (req, res, next) => {
  try {
    const roles = await listRoles();
    return successResponse(res, {
      message: "Roles retrieved successfully",
      data: { roles }
    });
  } catch (error) {
    return next(error);
  }
};

export const postRole = async (req, res, next) => {
  try {
    const role = await createRole({ req, actorId: req.user._id, payload: req.body });
    return successResponse(res, {
      statusCode: 201,
      message: "Role created successfully",
      data: { role }
    });
  } catch (error) {
    return next(error);
  }
};

export const patchRole = async (req, res, next) => {
  try {
    const role = await updateRole({ req, actorId: req.user._id, roleId: req.params.id, payload: req.body });
    return successResponse(res, {
      message: "Role updated successfully",
      data: { role }
    });
  } catch (error) {
    return next(error);
  }
};

export const removeRole = async (req, res, next) => {
  try {
    await deleteRole({ req, actorId: req.user._id, roleId: req.params.id });
    return successResponse(res, {
      message: "Role deleted successfully",
      data: null
    });
  } catch (error) {
    return next(error);
  }
};
