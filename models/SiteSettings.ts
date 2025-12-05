import mongoose, { Schema, model, models } from "mongoose";

const SiteSettingsSchema = new Schema(
  {
    heroImageUrl: {
      type: String,
      default: "/hero-shoe-minimalist.png",
    },
    heroSlides: {
      type: [
        {
          image: { type: String, required: true },
          title: { type: String, default: "" },
          subtitle: { type: String, default: "" },
          ctaText: { type: String, default: "Shop Now" },
          ctaLink: { type: String, default: "/collections" },
          color: { type: String, default: "#f3f4f6" },
        },
      ],
      default: [],
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
    googleTagManagerId: { type: String, default: "" },
    googleAnalyticsId: { type: String, default: "" },
    klaviyoPublicKey: { type: String, default: "" },
    tiktokPixelId: { type: String, default: "" },
    cjDropshippingApiKey: { type: String, default: "" },
    cjDropshippingUserId: { type: String, default: "" },
    cjAccessToken: { type: String, default: "" },
    cjRefreshToken: { type: String, default: "" },
    cjTokenExpiry: { type: Date },
    dobaAppKey: { type: String, default: "" },
    dobaAppSecret: { type: String, default: "" },
    affiliateProgramStatus: {
      type: String,
      enum: ["open", "closed", "postponed"],
      default: "open",
    },
  },
  { timestamps: true }
);

const SiteSettings =
  models.SiteSettings || model("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
