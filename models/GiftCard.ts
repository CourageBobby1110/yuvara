import mongoose, { Schema, Document } from "mongoose";

export interface IGiftCard extends Document {
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  purchasedBy?: mongoose.Types.ObjectId;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  status: "active" | "used" | "expired" | "cancelled";
  expirationDate?: Date;
  purchaseDate: Date;
  paymentReference?: string;
  lastUsedDate?: Date;
  usageHistory: Array<{
    orderId: mongoose.Types.ObjectId;
    amountUsed: number;
    date: Date;
  }>;
  isActive: boolean;
}

const GiftCardSchema = new Schema<IGiftCard>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    initialBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    currentBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
    },
    purchasedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    recipientEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    recipientName: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["active", "used", "expired", "cancelled"],
      default: "active",
      index: true,
    },
    expirationDate: {
      type: Date,
      required: false,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    lastUsedDate: {
      type: Date,
    },
    usageHistory: [
      {
        orderId: {
          type: Schema.Types.ObjectId,
          ref: "Order",
          required: true,
        },
        amountUsed: {
          type: Number,
          required: true,
          min: 0,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
GiftCardSchema.index({ code: 1, isActive: 1 });
GiftCardSchema.index({ status: 1, isActive: 1 });
GiftCardSchema.index({ purchasedBy: 1 });

// Method to check if gift card is valid
GiftCardSchema.methods.isValid = function (): boolean {
  if (!this.isActive || this.status !== "active") return false;
  if (this.currentBalance <= 0) return false;
  if (this.expirationDate && this.expirationDate < new Date()) return false;
  return true;
};

// Method to redeem gift card
GiftCardSchema.methods.redeem = function (
  amount: number,
  orderId: mongoose.Types.ObjectId
): boolean {
  if (!this.isValid()) return false;
  if (amount > this.currentBalance) return false;

  this.currentBalance -= amount;
  this.lastUsedDate = new Date();

  this.usageHistory.push({
    orderId,
    amountUsed: amount,
    date: new Date(),
  });

  if (this.currentBalance === 0) {
    this.status = "used";
  }

  return true;
};

const GiftCard =
  mongoose.models.GiftCard ||
  mongoose.model<IGiftCard>("GiftCard", GiftCardSchema);

export default GiftCard;
