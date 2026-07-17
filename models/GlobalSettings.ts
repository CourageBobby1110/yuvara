import mongoose, { Schema, model, models } from "mongoose";

const GlobalSettingsSchema = new Schema(
  {
    investmentProfitRate: {
      type: Number,
      required: true,
      default: 50, // Default to 50%
      min: 0,
      max: 1000, // Reasonable upper limit
    },
    bankAccountNumber: {
      type: String,
      default: "2052394593",
    },
    bankName: {
      type: String,
      default: "Kuda Bank",
    },
    bankAccountName: {
      type: String,
      default: "Chidi Courage Bobby",
    },
  },
  { timestamps: true }
);

const GlobalSettings =
  models.GlobalSettings || model("GlobalSettings", GlobalSettingsSchema);

export default GlobalSettings;
