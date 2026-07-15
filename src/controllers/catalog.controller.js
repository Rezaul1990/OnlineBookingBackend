import {
  createProvider,
  createService,
  createSlot,
  listAdminCatalog,
  listPublicCatalog,
  removeProvider,
  removeService,
  removeSlot,
  updateProvider,
  updateProviderImage,
  updateService,
  updateServiceImage,
  updateSlot
} from "../services/catalog.service.js";
import { buildUploadedImageUrl } from "../middlewares/upload.middleware.js";
import { successResponse } from "../utils/apiResponse.js";

export const getPublicCatalog = async (req, res, next) => {
  try {
    const services = await listPublicCatalog();
    return successResponse(res, {
      message: "Catalog retrieved successfully",
      data: { services }
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminCatalog = async (req, res, next) => {
  try {
    const catalog = await listAdminCatalog();
    return successResponse(res, {
      message: "Admin catalog retrieved successfully",
      data: catalog
    });
  } catch (error) {
    return next(error);
  }
};

export const postService = async (req, res, next) => {
  try {
    const service = await createService(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: "Service created successfully",
      data: { service }
    });
  } catch (error) {
    return next(error);
  }
};

export const postProvider = async (req, res, next) => {
  try {
    const provider = await createProvider(req.params.serviceId, req.body);
    return successResponse(res, {
      statusCode: 201,
      message: "Provider created successfully",
      data: { provider }
    });
  } catch (error) {
    return next(error);
  }
};

export const patchService = async (req, res, next) => {
  try {
    const service = await updateService(req.params.serviceId, req.body);
    return successResponse(res, { message: "Service updated successfully", data: { service } });
  } catch (error) {
    return next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const service = await removeService(req.params.serviceId);
    return successResponse(res, { message: "Service deleted successfully", data: { service } });
  } catch (error) {
    return next(error);
  }
};

export const patchProvider = async (req, res, next) => {
  try {
    const provider = await updateProvider(req.params.serviceId, req.params.providerId, req.body);
    return successResponse(res, { message: "Provider updated successfully", data: { provider } });
  } catch (error) {
    return next(error);
  }
};

export const deleteProvider = async (req, res, next) => {
  try {
    const provider = await removeProvider(req.params.serviceId, req.params.providerId);
    return successResponse(res, { message: "Provider deleted successfully", data: { provider } });
  } catch (error) {
    return next(error);
  }
};

export const postSlot = async (req, res, next) => {
  try {
    const provider = await createSlot(req.params.serviceId, req.params.providerId, req.body);
    return successResponse(res, {
      statusCode: 201,
      message: "Slot created successfully",
      data: { provider }
    });
  } catch (error) {
    return next(error);
  }
};

export const patchSlot = async (req, res, next) => {
  try {
    const provider = await updateSlot(req.params.serviceId, req.params.providerId, req.params.slotId, req.body);
    return successResponse(res, { message: "Slot updated successfully", data: { provider } });
  } catch (error) {
    return next(error);
  }
};

export const deleteSlot = async (req, res, next) => {
  try {
    const provider = await removeSlot(req.params.serviceId, req.params.providerId, req.params.slotId);
    return successResponse(res, { message: "Slot deleted successfully", data: { provider } });
  } catch (error) {
    return next(error);
  }
};

export const uploadServiceImage = async (req, res, next) => {
  try {
    const service = await updateServiceImage(req.params.serviceId, buildUploadedImageUrl(req));
    return successResponse(res, {
      message: "Service image uploaded successfully",
      data: { service }
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadProviderImage = async (req, res, next) => {
  try {
    const provider = await updateProviderImage(req.params.serviceId, req.params.providerId, buildUploadedImageUrl(req));
    return successResponse(res, {
      message: "Provider image uploaded successfully",
      data: { provider }
    });
  } catch (error) {
    return next(error);
  }
};
