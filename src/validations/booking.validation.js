const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createBookingSchema = (body) => {
  const errors = {};
  const data = {
    customerName: String(body.customerName || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim(),
    serviceName: String(body.serviceName || "").trim(),
    bookingDate: body.bookingDate,
    notes: String(body.notes || "").trim()
  };

  if (data.customerName.length < 2) errors.customerName = "Customer name must be at least 2 characters.";
  if (!emailPattern.test(data.email)) errors.email = "A valid email address is required.";
  if (data.phone.length < 6) errors.phone = "Phone number must be at least 6 characters.";
  if (data.serviceName.length < 2) errors.serviceName = "Service name must be at least 2 characters.";

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
