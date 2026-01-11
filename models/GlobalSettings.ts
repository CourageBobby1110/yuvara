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
  },
  { timestamps: true }
);

const GlobalSettings =
  models.GlobalSettings || model("GlobalSettings", GlobalSettingsSchema);

export default GlobalSettings;
