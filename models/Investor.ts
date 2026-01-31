import mongoose, { Schema, model, models } from "mongoose";

const InvestorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    accessPin: {
      type: String,
      required: [true, "Access Pin (Serial Number) is required"],
      unique: true,
      trim: true,
    },
    initialAmount: {
      type: Number,
      required: [true, "Initial Amount is required"],
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "completed", "withdrawn", "withdrawal_requested"],
      default: "active",
    },
    bankDetails: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
    },
    withdrawnProfit: {
      type: Number,
      default: 0,
    },
    cycleStartDate: {
      type: Date,
      default: Date.now,
    },
    activeCapital: {
      type: Number,
      default: 0, // Will default to initialAmount on creation if not set
    },
    rolloverHistory: [
      {
        date: Date,
        amountAdded: Number,
        newCapital: Number,
        isTopUp: { type: Boolean, default: false },
      },
    ],
    pendingTopUp: {
      type: Number,
      default: 0,
    },
    messages: {
      type: [
        {
          title: { type: String, required: true },
          content: { type: String, required: true },
          date: { type: Date, default: Date.now },
          isRead: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    reports: {
      type: [
        {
          subject: { type: String, required: true },
          message: { type: String, required: true },
          date: { type: Date, default: Date.now },
          status: { type: String, default: "pending" },
        },
      ],
      default: [],
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    termsAcceptedDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Pre-save hook to ensure activeCapital is set
InvestorSchema.pre("save", function (next) {
  if (this.isNew || !this.activeCapital) {
    if (!this.activeCapital) {
      this.activeCapital = this.initialAmount;
    }
  }
  if (this.isNew && !this.cycleStartDate) {
    this.cycleStartDate = this.startDate;
  }
  next();
});

export interface IInvestor extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  accessPin: string;
  initialAmount: number;
  activeCapital: number;
  startDate: Date;
  cycleStartDate: Date;
  status: "active" | "completed" | "withdrawn" | "withdrawal_requested";
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  withdrawnProfit: number;
  rolloverHistory: {
    date: Date;
    amountAdded: number;
    newCapital: number;
    isTopUp: boolean;
  }[];
  pendingTopUp: number;
  messages: {
    title: string;
    content: string;
    date: Date;
    isRead: boolean;
  }[];
  reports: {
    subject: string;
    message: string;
    date: Date;
    status: string;
  }[];
  termsAccepted: boolean;
  termsAcceptedDate?: Date;
}

const Investor =
  models.Investor || model<IInvestor>("Investor", InvestorSchema);

export default Investor;
