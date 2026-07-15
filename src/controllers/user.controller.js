import { createUser, listUsers, setupInvitedUserPassword, updateUser } from "../services/user.service.js";
import { successResponse } from "../utils/apiResponse.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await listUsers();
    return successResponse(res, {
      message: "Users retrieved successfully",
      data: { users }
    });
  } catch (error) {
    return next(error);
  }
};

export const postUser = async (req, res, next) => {
  try {
    const result = await createUser({ req, actorId: req.user._id, payload: req.body });
    return successResponse(res, {
      statusCode: 201,
      message: "User created successfully",
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

export const setupPassword = async (req, res, next) => {
  try {
    const user = await setupInvitedUserPassword(req.body);
    return successResponse(res, {
      message: "Password created successfully",
      data: { user }
    });
  } catch (error) {
    return next(error);
  }
};

export const patchUser = async (req, res, next) => {
  try {
    const user = await updateUser({ req, actorId: req.user._id, userId: req.params.id, payload: req.body });
    return successResponse(res, {
      message: "User updated successfully",
      data: { user }
    });
  } catch (error) {
    return next(error);
  }
};
