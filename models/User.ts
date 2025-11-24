import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      select: false,
    },
    image: {
      type: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "worker"],
    },
    emailVerified: {
      type: Date,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined to not conflict
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    referralCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const User = models?.User || model("User", UserSchema);

export default User;
