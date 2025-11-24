import mongoose, { Schema, model, models } from "mongoose";

const SiteSettingsSchema = new Schema(
  {
    heroImageUrl: {
      type: String,
      default: "/hero-shoe-minimalist.png",
    },
  },
  { timestamps: true }
);

const SiteSettings =
  models.SiteSettings || model("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
