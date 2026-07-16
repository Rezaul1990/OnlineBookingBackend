import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    actorName: { type: String, trim: true, default: "System" },
    actorRole: { type: String, trim: true, default: "system" },
    note: { type: String, trim: true, default: "" },
    at: { type: Date, default: Date.now }
  },
  { _id: true }
);

const bookingSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30
    },
    clientType: {
      type: String,
      enum: ["new", "returning"],
      default: "new"
    },
    serviceId: {
      type: String,
      trim: true
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    providerId: {
      type: String,
      trim: true
    },
    providerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    slotId: {
      type: String,
      trim: true
    },
    bookingDate: {
      type: Date,
      required: true
    },
    slotLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bkash", "nagad", "card"],
      default: "cash"
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "waived"],
      default: "unpaid"
    },
    paymentAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    paidAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    balanceAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    timeline: {
      type: [timelineSchema],
      default: []
    },
    publicToken: {
      type: String,
      required: true,
      select: false
    },
    status: {
      type: String,
      enum: ["pending_call", "confirmed", "reschedule_requested", "cancelled", "completed", "no_show"],
      default: "pending_call"
    }
  },
  { timestamps: true }
);

bookingSchema.index({ bookingDate: 1, status: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ paymentStatus: 1, paymentMethod: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
