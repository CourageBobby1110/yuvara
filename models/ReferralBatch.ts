import mongoose, { Schema, model, models } from "mongoose";

const ReferralBatchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxWinners: {
      type: Number,
      required: true,
      default: 20,
    },
    currentWinners: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const ReferralBatch = models.ReferralBatch || model("ReferralBatch", ReferralBatchSchema);

export default ReferralBatch;
