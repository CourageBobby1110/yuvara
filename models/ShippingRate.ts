import mongoose, { Schema, model, models } from "mongoose";

const ShippingRateSchema = new Schema(
  {
    country: {
      type: String,
      required: true,
      default: "Nigeria",
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    fee: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique state per country
ShippingRateSchema.index({ country: 1, state: 1 }, { unique: true });

// FIX: Rename model to 'ShippingRateIntl' to bust the Mongoose cache which holds the old schema.
// We explicitly set the collection name to 'shippingrates' to preserve existing data.
const ShippingRate =
  models.ShippingRateIntl ||
  model("ShippingRateIntl", ShippingRateSchema, "shippingrates");

export default ShippingRate;
