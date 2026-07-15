import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    date: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 1, min: 1 },
    active: { type: Boolean, default: true }
  },
  { _id: true }
);

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30 },
    bio: { type: String, trim: true, maxlength: 300, default: "" },
    imageUrl: { type: String, trim: true, maxlength: 500, default: "" },
    active: { type: Boolean, default: true },
    serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    slots: [slotSchema]
  },
  { timestamps: true }
);

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    imageUrl: { type: String, trim: true, maxlength: 500, default: "" },
    durationMinutes: { type: Number, required: true, min: 5, max: 480 },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    providerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Provider" }],
    providers: [providerSchema]
  },
  { timestamps: true }
);

serviceSchema.index({ active: 1, category: 1 });
serviceSchema.index({ name: "text", category: "text", description: "text" });

export const Service = mongoose.model("Service", serviceSchema);
export const Provider = mongoose.model("Provider", providerSchema);
