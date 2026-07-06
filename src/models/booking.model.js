import mongoose from "mongoose";

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
    serviceName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    bookingDate: {
      type: Date,
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

bookingSchema.index({ bookingDate: 1, status: 1 });
bookingSchema.index({ email: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
