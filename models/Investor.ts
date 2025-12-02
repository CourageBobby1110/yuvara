import mongoose, { Schema, model, models } from "mongoose";

const InvestorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    accessPin: {
      type: String,
      required: [true, "Access Pin (Serial Number) is required"],
      unique: true,
      trim: true,
    },
    initialAmount: {
      type: Number,
      required: [true, "Initial Amount is required"],
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "withdrawn", "withdrawal_requested"],
      default: "active",
    },
    bankDetails: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
    },
    messages: {
      type: [
        {
          title: { type: String, required: true },
          content: { type: String, required: true },
          date: { type: Date, default: Date.now },
          isRead: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    reports: {
      type: [
        {
          subject: { type: String, required: true },
          message: { type: String, required: true },
          date: { type: Date, default: Date.now },
          status: { type: String, default: "pending" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Investor = models.Investor || model("Investor", InvestorSchema);

export default Investor;
