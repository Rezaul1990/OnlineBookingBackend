import mongoose from "mongoose";
import { Provider, Service } from "../models/service.model.js";
import { AppError } from "../utils/AppError.js";
import { ensureDatabaseReady } from "../utils/databaseReady.js";
import { slugify } from "../utils/slugify.js";

const sampleCatalog = [
  {
    _id: "sample-consultation",
    name: "Business Consultation",
    slug: "business-consultation",
    category: "Consulting",
    description: "One-to-one planning session for business, project, or service decisions.",
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",
    durationMinutes: 45,
    price: 50,
    active: true,
    providerIds: ["provider-a", "provider-b"],
    providers: [
      {
        _id: "provider-a",
        name: "Ayesha Rahman",
        title: "Senior Consultant",
        email: "ayesha@example.com",
        phone: "+8801700000001",
        bio: "Best for first-time planning and service selection.",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
        active: true,
        serviceIds: ["sample-consultation"],
        slots: [
          { _id: "slot-a-1", date: "2026-07-08", startTime: "10:00", endTime: "10:45", capacity: 1, active: true },
          { _id: "slot-a-2", date: "2026-07-08", startTime: "12:00", endTime: "12:45", capacity: 1, active: true }
        ]
      },
      {
        _id: "provider-b",
        name: "Tanvir Hasan",
        title: "Operations Advisor",
        email: "tanvir@example.com",
        phone: "+8801700000002",
        bio: "Strong fit for workflow setup and operational bookings.",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        active: true,
        serviceIds: ["sample-consultation"],
        slots: [
          { _id: "slot-b-1", date: "2026-07-08", startTime: "11:00", endTime: "11:45", capacity: 1, active: true },
          { _id: "slot-b-2", date: "2026-07-10", startTime: "16:00", endTime: "16:45", capacity: 1, active: true }
        ]
      }
    ]
  },
  {
    _id: "sample-care",
    name: "Care Appointment",
    slug: "care-appointment",
    category: "Personal Service",
    description: "Book a standard care/service appointment with an available provider.",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80",
    durationMinutes: 60,
    price: 80,
    active: true,
    providerIds: ["provider-c"],
    providers: [
      {
        _id: "provider-c",
        name: "Nusrat Jahan",
        title: "Service Provider",
        email: "nusrat@example.com",
        phone: "+8801700000003",
        bio: "Available for regular service appointments.",
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
        active: true,
        serviceIds: ["sample-care"],
        slots: [
          { _id: "slot-c-1", date: "2026-07-09", startTime: "09:30", endTime: "10:30", capacity: 1, active: true },
          { _id: "slot-c-2", date: "2026-07-10", startTime: "14:00", endTime: "15:00", capacity: 1, active: true }
        ]
      }
    ]
  }
];

const canUseDatabase = () => {
  try {
    ensureDatabaseReady();
    return true;
  } catch {
    return false;
  }
};

const normalizeIds = (ids = []) => {
  return [...new Set(ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => String(id)))];
};

const attachProvidersToServices = (services, providers, publicOnly = false) => {
  return services.map((service) => {
    const serviceId = String(service._id);
    const assignedProviders = providers
      .filter((provider) => provider.serviceIds?.map(String).includes(serviceId))
      .filter((provider) => !publicOnly || provider.active)
      .map((provider) => ({
        ...provider,
        slots: (provider.slots || []).filter((slot) => !publicOnly || slot.active)
      }));

    return {
      ...service,
      providerIds: assignedProviders.map((provider) => provider._id),
      providers: assignedProviders
    };
  });
};

const syncServiceAssignments = async (serviceId, providerIds) => {
  await Provider.updateMany({ serviceIds: serviceId, _id: { $nin: providerIds } }, { $pull: { serviceIds: serviceId } });
  if (providerIds.length) {
    await Provider.updateMany({ _id: { $in: providerIds } }, { $addToSet: { serviceIds: serviceId } });
  }
};

const syncProviderAssignments = async (providerId, serviceIds) => {
  await Service.updateMany({ providerIds: providerId, _id: { $nin: serviceIds } }, { $pull: { providerIds: providerId } });
  if (serviceIds.length) {
    await Service.updateMany({ _id: { $in: serviceIds } }, { $addToSet: { providerIds: providerId } });
  }
};

export const listPublicCatalog = async () => {
  if (!canUseDatabase()) return sampleCatalog;

  const [services, providers] = await Promise.all([
    Service.find({ active: true }).sort({ category: 1, name: 1 }).lean(),
    Provider.find({ active: true }).sort({ name: 1 }).lean()
  ]);
  return attachProvidersToServices(services, providers, true);
};

export const listAdminCatalog = async () => {
  ensureDatabaseReady();
  const [services, providers] = await Promise.all([
    Service.find().sort({ category: 1, name: 1 }).lean(),
    Provider.find().sort({ name: 1 }).lean()
  ]);

  return {
    services: attachProvidersToServices(services, providers, false),
    providers
  };
};

export const createService = async (payload) => {
  ensureDatabaseReady();
  const providerIds = normalizeIds(payload.providerIds);
  const service = await Service.create({
    ...payload,
    providerIds,
    slug: slugify(payload.name),
    providers: []
  });
  await syncServiceAssignments(service._id, providerIds);
  return service;
};

export const updateService = async (serviceId, payload) => {
  ensureDatabaseReady();
  const providerIds = normalizeIds(payload.providerIds);
  const update = { ...payload, providerIds };
  if (payload.name) update.slug = slugify(payload.name);
  const service = await Service.findByIdAndUpdate(serviceId, update, { new: true, runValidators: true });
  if (!service) throw new AppError("Service not found.", 404);
  await syncServiceAssignments(service._id, providerIds);
  return service;
};

export const removeService = async (serviceId) => {
  ensureDatabaseReady();
  const service = await Service.findByIdAndDelete(serviceId);
  if (!service) throw new AppError("Service not found.", 404);
  await Provider.updateMany({ serviceIds: service._id }, { $pull: { serviceIds: service._id } });
  return service;
};

export const createProvider = async (serviceId, payload) => {
  ensureDatabaseReady();
  const serviceIds = normalizeIds(payload.serviceIds?.length ? payload.serviceIds : [serviceId]);
  const provider = await Provider.create({ ...payload, serviceIds, slots: [] });
  await syncProviderAssignments(provider._id, serviceIds);
  return provider;
};

export const updateProvider = async (serviceId, providerId, payload) => {
  ensureDatabaseReady();
  const serviceIds = normalizeIds(payload.serviceIds?.length ? payload.serviceIds : [serviceId]);
  const provider = await Provider.findByIdAndUpdate(providerId, { ...payload, serviceIds }, { new: true, runValidators: true });
  if (!provider) throw new AppError("Provider not found.", 404);
  await syncProviderAssignments(provider._id, serviceIds);
  return provider;
};

export const removeProvider = async (serviceId, providerId) => {
  ensureDatabaseReady();
  const provider = await Provider.findByIdAndDelete(providerId);
  if (!provider) throw new AppError("Provider not found.", 404);
  await Service.updateMany({ providerIds: provider._id }, { $pull: { providerIds: provider._id } });
  return provider;
};

export const createSlot = async (serviceId, providerId, payload) => {
  ensureDatabaseReady();
  const provider = await Provider.findById(providerId);
  if (!provider) throw new AppError("Provider not found.", 404);
  if (!provider.serviceIds.map(String).includes(String(serviceId))) {
    throw new AppError("Provider is not assigned to this service.", 400);
  }
  provider.slots.push({ ...payload, serviceId });
  await provider.save();
  return provider;
};

export const updateSlot = async (serviceId, providerId, slotId, payload) => {
  ensureDatabaseReady();
  const provider = await Provider.findById(providerId);
  if (!provider) throw new AppError("Provider not found.", 404);
  const slot = provider.slots.id(slotId);
  if (!slot) throw new AppError("Slot not found.", 404);
  slot.set({ ...payload, serviceId });
  await provider.save();
  return provider;
};

export const removeSlot = async (serviceId, providerId, slotId) => {
  ensureDatabaseReady();
  const provider = await Provider.findById(providerId);
  if (!provider) throw new AppError("Provider not found.", 404);
  const slot = provider.slots.id(slotId);
  if (!slot) throw new AppError("Slot not found.", 404);
  slot.deleteOne();
  await provider.save();
  return provider;
};

export const updateServiceImage = async (serviceId, imageUrl) => {
  ensureDatabaseReady();
  const service = await Service.findByIdAndUpdate(serviceId, { imageUrl }, { new: true });
  if (!service) throw new AppError("Service not found.", 404);
  return service;
};

export const updateProviderImage = async (serviceId, providerId, imageUrl) => {
  ensureDatabaseReady();
  const provider = await Provider.findByIdAndUpdate(providerId, { imageUrl }, { new: true });
  if (!provider) throw new AppError("Provider not found.", 404);
  return provider;
};
