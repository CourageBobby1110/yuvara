import mongoose, { Schema, model, models } from "mongoose";

const WhatsAppSessionSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      sparse: true,
    },
    conversationHistory: {
      type: [
        {
          role: { type: String, enum: ["user", "assistant"], required: true },
          content: { type: String, required: true },
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    cart: {
      type: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          name: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, default: 1 },
          image: { type: String },
          variantColor: { type: String },
          variantSize: { type: String },
          cjVid: { type: String },
        },
      ],
      default: [],
    },
    state: {
      type: String,
      enum: [
        "idle",
        "browsing",
        "viewing_product",
        "checkout",
        "awaiting_address",
        "awaiting_payment",
        "registering_name",
        "registering_email",
        "registering_password",
      ],
      default: "idle",
    },
    // Temp data for multi-step flows
    tempData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Paystack DVA
    paystackCustomerCode: { type: String },
    dvaAccountNumber: { type: String },
    dvaBankName: { type: String },
    dvaAccountName: { type: String },
    // Shipping address collected via chat
    shippingAddress: {
      email: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: "Nigeria" },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastPromoSentAt: {
      type: Date,
    },
    registeredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Keep only last 20 messages in conversation history to save space
WhatsAppSessionSchema.pre("save", function (next) {
  if (this.conversationHistory && this.conversationHistory.length > 20) {
    const excess = this.conversationHistory.length - 20;
    this.conversationHistory.splice(0, excess);
  }
  next();
});

const WhatsAppSession =
  models.WhatsAppSession ||
  model("WhatsAppSession", WhatsAppSessionSchema);

export default WhatsAppSession;
