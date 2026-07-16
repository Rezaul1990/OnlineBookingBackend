const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const todayDateString = () => new Date().toISOString().slice(0, 10);

export const serviceSchema = (body) => {
  const errors = {};
  const data = {
    name: String(body.name || "").trim(),
    category: String(body.category || "").trim(),
    description: String(body.description || "").trim(),
    durationMinutes: Number(body.durationMinutes),
    price: Number(body.price),
    providerIds: Array.isArray(body.providerIds) ? body.providerIds.map((id) => String(id).trim()).filter(Boolean) : [],
    active: body.active !== false
  };

  if (data.name.length < 2) errors.name = "Service name must be at least 2 characters.";
  if (data.category.length < 2) errors.category = "Category must be at least 2 characters.";
  if (data.description.length < 10) errors.description = "Description must be at least 10 characters.";
  if (!Number.isFinite(data.durationMinutes) || data.durationMinutes < 5) errors.durationMinutes = "Duration must be at least 5 minutes.";
  if (!Number.isFinite(data.price) || data.price < 0) errors.price = "Price must be zero or higher.";

  return { valid: Object.keys(errors).length === 0, errors, data };
};

export const providerSchema = (body) => {
  const errors = {};
  const data = {
    name: String(body.name || "").trim(),
    title: String(body.title || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim(),
    bio: String(body.bio || "").trim(),
    serviceIds: Array.isArray(body.serviceIds) ? body.serviceIds.map((id) => String(id).trim()).filter(Boolean) : [],
    active: body.active !== false
  };

  if (data.name.length < 2) errors.name = "Provider name must be at least 2 characters.";
  if (data.title.length < 2) errors.title = "Provider title must be at least 2 characters.";
  if (data.email && !emailPattern.test(data.email)) errors.email = "Provider email must be valid.";
  if (data.phone && data.phone.length < 6) errors.phone = "Provider phone must be at least 6 characters.";
  if (data.bio.length > 300) errors.bio = "Provider bio cannot exceed 300 characters.";
  if (!data.serviceIds.length) errors.serviceIds = "Select at least one service for this provider.";

  return { valid: Object.keys(errors).length === 0, errors, data };
};

export const slotSchema = (body) => {
  const errors = {};
  const data = {
    date: String(body.date || "").trim(),
    startTime: String(body.startTime || "").trim(),
    endTime: String(body.endTime || "").trim(),
    capacity: Number(body.capacity || 1),
    active: body.active !== false
  };

  const parsedDate = new Date(`${data.date}T00:00:00`);
  if (!data.date || Number.isNaN(parsedDate.getTime())) errors.date = "A valid slot date is required.";
  if (data.date && data.date < todayDateString()) errors.date = "Slot date cannot be in the past.";
  if (!timePattern.test(data.startTime)) errors.startTime = "Start time must use HH:mm format.";
  if (!timePattern.test(data.endTime)) errors.endTime = "End time must use HH:mm format.";
  if (data.startTime >= data.endTime) errors.endTime = "End time must be after start time.";
  if (!Number.isFinite(data.capacity) || data.capacity < 1) errors.capacity = "Capacity must be at least 1.";

  return { valid: Object.keys(errors).length === 0, errors, data };
};

export const bulkSlotSchema = (body) => {
  const errors = {};
  const data = {
    dateFrom: String(body.dateFrom || "").trim(),
    dateTo: String(body.dateTo || "").trim(),
    selectedDays: Array.isArray(body.selectedDays) ? body.selectedDays.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : [],
    startTime: String(body.startTime || "").trim(),
    endTime: String(body.endTime || "").trim(),
    durationMinutes: Number(body.durationMinutes || 30),
    capacity: Number(body.capacity || 1),
    active: body.active !== false
  };

  const parsedFrom = new Date(`${data.dateFrom}T00:00:00`);
  const parsedTo = new Date(`${data.dateTo}T00:00:00`);
  if (!data.dateFrom || Number.isNaN(parsedFrom.getTime())) errors.dateFrom = "A valid start date is required.";
  if (!data.dateTo || Number.isNaN(parsedTo.getTime())) errors.dateTo = "A valid end date is required.";
  if (data.dateFrom && data.dateFrom < todayDateString()) errors.dateFrom = "Start date cannot be in the past.";
  if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) errors.dateTo = "End date must be after start date.";
  if (!data.selectedDays.length) errors.selectedDays = "Select at least one day.";
  if (!timePattern.test(data.startTime)) errors.startTime = "Start time must use HH:mm format.";
  if (!timePattern.test(data.endTime)) errors.endTime = "End time must use HH:mm format.";
  if (data.startTime >= data.endTime) errors.endTime = "End time must be after start time.";
  if (!Number.isFinite(data.durationMinutes) || data.durationMinutes < 5) errors.durationMinutes = "Duration must be at least 5 minutes.";
  if (!Number.isFinite(data.capacity) || data.capacity < 1) errors.capacity = "Capacity must be at least 1.";

  const maxDays = 370;
  if (!errors.dateFrom && !errors.dateTo) {
    const days = Math.ceil((parsedTo.getTime() - parsedFrom.getTime()) / 86400000) + 1;
    if (days > maxDays) errors.dateTo = "Create slots for one year at a time.";
  }

  return { valid: Object.keys(errors).length === 0, errors, data };
};

export const closedDateSchema = (body) => {
  const errors = {};
  const data = {
    date: String(body.date || "").trim(),
    reason: String(body.reason || "").trim()
  };

  const parsedDate = new Date(`${data.date}T00:00:00`);
  if (!data.date || Number.isNaN(parsedDate.getTime())) errors.date = "A valid close date is required.";
  if (data.date && data.date < todayDateString()) errors.date = "Close date cannot be in the past.";
  if (data.reason.length > 160) errors.reason = "Reason cannot exceed 160 characters.";

  return { valid: Object.keys(errors).length === 0, errors, data };
};
