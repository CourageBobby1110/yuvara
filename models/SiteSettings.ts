import mongoose, { Schema, model, models } from "mongoose";

const SiteSettingsSchema = new Schema(
  {
    heroImageUrl: {
      type: String,
      default: "/hero-shoe-minimalist.png",
    },
    categoryImages: {
      men: { type: String, default: "/men-category.jpg" },
      women: { type: String, default: "/women-category.jpg" },
      accessories: { type: String, default: "/accessories-category.jpg" },
    },
    brandStoryImage: {
      type: String,
      default: "/brand-story.png",
    },
  },
  { timestamps: true }
);

const SiteSettings =
  models.SiteSettings || model("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
