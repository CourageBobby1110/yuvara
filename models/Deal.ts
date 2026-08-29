import mongoose, { Schema, model, models } from "mongoose";

const DealSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["countdown", "limited"], // "countdown" for Lightning/Timed deals, "limited" for Limited/Clearance deals
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    customTitle: {
      type: String,
      trim: true,
    },
    customImage: {
      type: String,
    },
    dealPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    // For countdown deals
    endTime: {
      type: Date,
    },
    durationHours: {
      type: Number,
      default: 24,
    },
    claimedPercent: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    // For limited deals
    stockRemaining: {
      type: Number,
      default: 5,
    },
    stockTag: {
      type: String,
      default: "Only 5 left",
    },
    rating: {
      type: Number,
      default: 4.9,
    },
    reviewCount: {
      type: Number,
      default: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export type DealDocument = {
  _id: string;
  type: "countdown" | "limited";
  product: any;
  customTitle?: string;
  customImage?: string;
  dealPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  endTime?: Date;
  durationHours?: number;
  claimedPercent?: number;
  stockRemaining?: number;
  stockTag?: string;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
};

const Deal = models.Deal || model("Deal", DealSchema);
export default Deal;
