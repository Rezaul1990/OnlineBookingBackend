import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Provider, Service } from "../models/service.model.js";
import { AppError } from "../utils/AppError.js";
import { ensureDatabaseReady } from "../utils/databaseReady.js";
import { addDaysToDateString, getTodayDateString, isFutureSlotTime } from "../utils/date.js";
import { slugify } from "../utils/slugify.js";

const sampleDate = (offsetDays) => addDaysToDateString(getTodayDateString(), offsetDays);

const sampleTime = (offsetHours) => {
  const date = new Date();
  date.setHours(date.getHours() + offsetHours, 0, 0, 0);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dhaka" });
};

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
          { _id: "slot-a-1", date: sampleDate(0), startTime: sampleTime(1), endTime: sampleTime(2), capacity: 1, active: true },
          { _id: "slot-a-2", date: sampleDate(0), startTime: sampleTime(3), endTime: sampleTime(4), capacity: 1, active: true },
          { _id: "slot-a-3", date: sampleDate(1), startTime: "10:00", endTime: "10:45", capacity: 1, active: true }
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
          { _id: "slot-b-1", date: sampleDate(0), startTime: sampleTime(2), endTime: sampleTime(3), capacity: 1, active: true },
          { _id: "slot-b-2", date: sampleDate(2), startTime: "16:00", endTime: "16:45", capacity: 1, active: true }
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
          { _id: "slot-c-1", date: sampleDate(1), startTime: "09:30", endTime: "10:30", capacity: 1, active: true },
          { _id: "slot-c-2", date: sampleDate(3), startTime: "14:00", endTime: "15:00", capacity: 1, active: true }
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

const blockingStatuses = ["pending_call", "confirmed"];

const buildBookedSlotCounts = async () => {
  const bookings = await Booking.aggregate([
    { $match: { status: { $in: blockingStatuses }, bookingDate: { $gte: new Date(`${getTodayDateString()}T00:00:00.000Z`) } } },
    { $group: { _id: "$slotId", count: { $sum: 1 } } }
  ]);
  return new Map(bookings.map((booking) => [String(booking._id), booking.count]));
};

const publicSlotFilter = (slot, bookedSlotCounts = new Map()) => {
  if (!slot.active || !isFutureSlotTime(slot.date, slot.startTime)) return false;

  const bookedCount = bookedSlotCounts.get(String(slot._id)) || 0;
  return bookedCount < slot.capacity;
};

const providerClosedDates = (provider) => new Set((provider.closedDates || []).map((closedDate) => closedDate.date || closedDate));

const sortSlots = (slots) => {
  return [...slots].sort((first, second) => `${first.date} ${first.startTime}`.localeCompare(`${second.date} ${second.startTime}`));
};

const attachProvidersToServices = (services, providers, publicOnly = false, bookedSlotCounts = new Map()) => {
  return services.map((service) => {
    const serviceId = String(service._id);
    const assignedProviders = providers
      .filter((provider) => provider.serviceIds?.map(String).includes(serviceId))
      .filter((provider) => !publicOnly || provider.active)
      .map((provider) => ({
        ...provider,
        slots: sortSlots((provider.slots || []).filter((slot) => !publicOnly || (!providerClosedDates(provider).has(slot.date) && publicSlotFilter(slot, bookedSlotCounts))))
      }))
      .filter((provider) => !publicOnly || provider.slots.length > 0);

    return {
      ...service,
      providerIds: assignedProviders.map((provider) => provider._id),
      providers: assignedProviders
    };
  }).filter((service) => !publicOnly || service.providers.length > 0);
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

const createDefaultCatalog = async () => {
  const serviceIdMap = new Map();
  const providerIdsByService = new Map();

  for (const sampleService of sampleCatalog) {
    const service = await Service.findOneAndUpdate(
      { slug: sampleService.slug },
      {
        name: sampleService.name,
        slug: sampleService.slug,
        category: sampleService.category,
        description: sampleService.description,
        imageUrl: sampleService.imageUrl,
        durationMinutes: sampleService.durationMinutes,
        price: sampleService.price,
        active: true,
        providers: []
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    serviceIdMap.set(sampleService._id, service._id);
    providerIdsByService.set(String(service._id), []);
  }

  for (const sampleService of sampleCatalog) {
    const serviceId = serviceIdMap.get(sampleService._id);
    for (const sampleProvider of sampleService.providers) {
      const existingProvider = await Provider.findOne({ email: sampleProvider.email });
      const providerPayload = {
        name: sampleProvider.name,
        title: sampleProvider.title,
        email: sampleProvider.email,
        phone: sampleProvider.phone,
        bio: sampleProvider.bio,
        imageUrl: sampleProvider.imageUrl,
        active: true,
        serviceIds: [serviceId],
        slots: sampleProvider.slots.map((slot) => ({ ...slot, _id: undefined, serviceId }))
      };
      const provider = existingProvider
        ? await Provider.findByIdAndUpdate(existingProvider._id, providerPayload, { new: true, runValidators: true })
        : await Provider.create(providerPayload);
      providerIdsByService.get(String(serviceId))?.push(provider._id);
    }
  }

  for (const [serviceId, providerIds] of providerIdsByService.entries()) {
    await Service.findByIdAndUpdate(serviceId, { providerIds });
  }
};

export const listPublicCatalog = async () => {
  if (!canUseDatabase()) return attachProvidersToServices(sampleCatalog, sampleCatalog.flatMap((service) => service.providers), true);

  let [services, providers] = await Promise.all([
    Service.find({ active: true }).sort({ category: 1, name: 1 }).lean(),
    Provider.find({ active: true }).sort({ name: 1 }).lean()
  ]);
  if (!services.length || !providers.length) {
    await createDefaultCatalog();
    [services, providers] = await Promise.all([
      Service.find({ active: true }).sort({ category: 1, name: 1 }).lean(),
      Provider.find({ active: true }).sort({ name: 1 }).lean()
    ]);
  }
  const bookedSlotCounts = await buildBookedSlotCounts();
  return attachProvidersToServices(services, providers, true, bookedSlotCounts);
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
  const duplicateSlot = provider.slots.some((slot) => {
    return String(slot.serviceId) === String(serviceId) && slot.date === payload.date && slot.startTime === payload.startTime && slot.endTime === payload.endTime;
  });
  if (duplicateSlot) {
    throw new AppError("This provider already has a slot for that date and time.", 409);
  }
  provider.slots.push({ ...payload, serviceId });
  await provider.save();
  return provider;
};

const addMinutes = (time, minutes) => {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hours, mins + minutes, 0, 0);
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
};

const minutesSinceMidnight = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const nextDateString = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

export const createBulkSlots = async (serviceId, providerId, payload) => {
  ensureDatabaseReady();
  const provider = await Provider.findById(providerId);
  if (!provider) throw new AppError("Provider not found.", 404);
  if (!provider.serviceIds.map(String).includes(String(serviceId))) {
    throw new AppError("Provider is not assigned to this service.", 400);
  }

  const startMinutes = minutesSinceMidnight(payload.startTime);
  const endMinutes = minutesSinceMidnight(payload.endTime);
  const intervalsPerDay = Math.floor((endMinutes - startMinutes) / payload.durationMinutes);
  if (intervalsPerDay < 1) throw new AppError("Duration must fit inside the selected start and end time.", 400);

  const existingKeys = new Set(
    provider.slots.map((slot) => [String(slot.serviceId), slot.date, slot.startTime, slot.endTime].join("|"))
  );
  const closedDates = providerClosedDates(provider);
  const slots = [];
  let skippedClosed = 0;
  let skippedDuplicates = 0;

  for (let date = payload.dateFrom; date <= payload.dateTo; date = nextDateString(date)) {
    const day = new Date(`${date}T00:00:00`).getDay();
    if (!payload.selectedDays.includes(day)) continue;
    if (closedDates.has(date)) {
      skippedClosed += intervalsPerDay;
      continue;
    }

    for (let index = 0; index < intervalsPerDay; index += 1) {
      const startTime = addMinutes(payload.startTime, index * payload.durationMinutes);
      const endTime = addMinutes(startTime, payload.durationMinutes);
      const key = [String(serviceId), date, startTime, endTime].join("|");
      if (existingKeys.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      existingKeys.add(key);
      slots.push({ serviceId, date, startTime, endTime, capacity: payload.capacity, active: payload.active });
    }
  }

  if (slots.length > 2500) throw new AppError("Too many slots at once. Narrow the date range or increase duration.", 400);
  provider.slots.push(...slots);
  await provider.save();
  return { provider, created: slots.length, skippedDuplicates, skippedClosed };
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

export const addProviderClosedDate = async (providerId, payload) => {
  ensureDatabaseReady();
  const provider = await Provider.findById(providerId);
  if (!provider) throw new AppError("Provider not found.", 404);
  const exists = provider.closedDates?.some((closedDate) => closedDate.date === payload.date);
  if (!exists) provider.closedDates.push(payload);
  await provider.save();
  return provider;
};

export const removeProviderClosedDate = async (providerId, date) => {
  ensureDatabaseReady();
  const provider = await Provider.findById(providerId);
  if (!provider) throw new AppError("Provider not found.", 404);
  provider.closedDates = (provider.closedDates || []).filter((closedDate) => closedDate.date !== date);
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
