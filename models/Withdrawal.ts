import mongoose, { Schema, model, models } from "mongoose";

const WithdrawalSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
    },
    adminNote: {
      type: String,
    },
  },
  { timestamps: true }
);

const Withdrawal = models?.Withdrawal || model("Withdrawal", WithdrawalSchema);

export default Withdrawal;
