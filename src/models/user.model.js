import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120
    },
    passwordHash: {
      type: String,
      required: true
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true
    },
    status: {
      type: String,
      enum: ["invited", "active", "inactive", "suspended"],
      default: "invited"
    },
    inviteTokenHash: {
      type: String,
      default: null,
      select: false
    },
    inviteExpiresAt: {
      type: Date,
      default: null
    },
    passwordSetAt: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

userSchema.index({ roleId: 1, status: 1 });

export const User = mongoose.model("User", userSchema);
