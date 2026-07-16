const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const paymentMethods = ["cash", "bkash", "nagad", "card"];
const paymentStatuses = ["unpaid", "partial", "paid", "waived"];

const isPastDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const createBookingSchema = (body) => {
  const errors = {};
  const data = {
    customerName: String(body.customerName || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim(),
    clientType: body.clientType === "returning" ? "returning" : "new",
    serviceId: String(body.serviceId || "").trim(),
    serviceName: String(body.serviceName || "").trim(),
    providerId: String(body.providerId || "").trim(),
    providerName: String(body.providerName || "").trim(),
    slotId: String(body.slotId || "").trim(),
    slotLabel: String(body.slotLabel || "").trim(),
    bookingDate: body.bookingDate,
    paymentMethod: paymentMethods.includes(body.paymentMethod) ? body.paymentMethod : "cash",
    paymentAmount: Number(body.paymentAmount || 0),
    notes: String(body.notes || "").trim()
  };

  if (data.customerName.length < 2) errors.customerName = "Customer name must be at least 2 characters.";
  if (!emailPattern.test(data.email)) errors.email = "A valid email address is required.";
  if (data.phone.length < 6) errors.phone = "Phone number must be at least 6 characters.";
  if (!data.serviceId) errors.serviceId = "Please select a service.";
  if (data.serviceName.length < 2) errors.serviceName = "Service name must be at least 2 characters.";
  if (!data.providerId) errors.providerId = "Please select a provider.";
  if (data.providerName.length < 2) errors.providerName = "Provider name must be at least 2 characters.";
  if (!data.slotId) errors.slotId = "Please select a time slot.";
  if (data.slotLabel.length < 2) errors.slotLabel = "Slot label is required.";

  const parsedDate = new Date(data.bookingDate);
  if (Number.isNaN(parsedDate.getTime())) {
    errors.bookingDate = "A valid booking date is required.";
  } else if (isPastDate(parsedDate)) {
    errors.bookingDate = "Booking date cannot be in the past.";
  } else {
    data.bookingDate = parsedDate;
  }

  if (data.notes.length > 500) errors.notes = "Notes cannot exceed 500 characters.";
  if (!Number.isFinite(data.paymentAmount) || data.paymentAmount < 0) errors.paymentAmount = "Payment amount must be zero or higher.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data
  };
};

export const bookingStatusSchema = (body) => {
  const status = String(body.status || "").trim();
  const allowedStatuses = ["pending_call", "confirmed", "reschedule_requested", "cancelled", "completed", "no_show"];
  const errors = {};

  if (!allowedStatuses.includes(status)) {
    errors.status = "A valid booking status is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { status }
  };
};

export const adminBookingSchema = (body) => {
  const errors = {};
  const data = {
    customerName: String(body.customerName || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim(),
    clientType: body.clientType === "returning" ? "returning" : "new",
    serviceId: String(body.serviceId || "").trim(),
    serviceName: String(body.serviceName || "").trim(),
    providerId: String(body.providerId || "").trim(),
    providerName: String(body.providerName || "").trim(),
    slotId: String(body.slotId || "").trim(),
    slotLabel: String(body.slotLabel || "").trim(),
    bookingDate: body.bookingDate,
    notes: String(body.notes || "").trim(),
    paymentMethod: paymentMethods.includes(body.paymentMethod) ? body.paymentMethod : "cash",
    paymentStatus: paymentStatuses.includes(body.paymentStatus) ? body.paymentStatus : "unpaid",
    paymentAmount: Number(body.paymentAmount || 0),
    paidAmount: Number(body.paidAmount || 0),
    status: String(body.status || "pending_call").trim()
  };

  if (data.customerName.length < 2) errors.customerName = "Customer name must be at least 2 characters.";
  if (!emailPattern.test(data.email)) errors.email = "A valid email address is required.";
  if (data.phone.length < 6) errors.phone = "Phone number must be at least 6 characters.";
  if (data.serviceName.length < 2) errors.serviceName = "Service name must be at least 2 characters.";
  if (data.providerName.length < 2) errors.providerName = "Provider name must be at least 2 characters.";
  if (data.slotLabel.length < 2) errors.slotLabel = "Slot label is required.";
  if (!["pending_call", "confirmed", "reschedule_requested", "cancelled", "completed", "no_show"].includes(data.status)) errors.status = "A valid booking status is required.";
  if (!Number.isFinite(data.paymentAmount) || data.paymentAmount < 0) errors.paymentAmount = "Payment amount must be zero or higher.";
  if (!Number.isFinite(data.paidAmount) || data.paidAmount < 0) errors.paidAmount = "Paid amount must be zero or higher.";
  if (data.paidAmount > data.paymentAmount && !["cancelled", "no_show"].includes(data.status)) errors.paidAmount = "Paid amount cannot exceed payment amount.";

  const parsedDate = new Date(data.bookingDate);
  if (Number.isNaN(parsedDate.getTime())) {
    errors.bookingDate = "A valid booking date is required.";
  } else {
    data.bookingDate = parsedDate;
  }

  if (data.notes.length > 500) errors.notes = "Notes cannot exceed 500 characters.";

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data
  };
};

export const publicBookingStatusSchema = (body) => {
  const status = String(body.status || "").trim();
  const publicToken = String(body.publicToken || "").trim();
  const errors = {};

  if (!["reschedule_requested", "cancelled"].includes(status)) {
    errors.status = "Only reschedule and cancel actions are allowed.";
  }
  if (publicToken.length < 20) {
    errors.publicToken = "A valid booking token is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { status, publicToken }
  };
};
