import mongoose, { Schema, model, models } from "mongoose";

const DeletionLogSchema = new Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    deletedBy: {
      type: String,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: false }
);

// Optional: Expire documents after 30 days to keep the collection clean
DeletionLogSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const DeletionLog = models.DeletionLog || model("DeletionLog", DeletionLogSchema);

export default DeletionLog;
