import mongoose, { Schema, model, models } from "mongoose";

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "fixed", // Default for referral coupons
    },
    value: {
      type: Number,
      default: 0, // Default for referral coupons (might be calculated or fixed)
    },
    expirationDate: {
      type: Date,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Fields for Referral System
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: "ReferralBatch",
      required: false,
    },
    maxAmount: {
      type: Number,
      required: false,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  { timestamps: true }
);

// Use a new model name to bust the cache of the old model
const Coupon = models.CouponV2 || model("CouponV2", CouponSchema, "coupons");

export default Coupon;
