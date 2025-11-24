import mongoose, { Schema, model, models } from "mongoose";

const SubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Subscriber = models.Subscriber || model("Subscriber", SubscriberSchema);

export default Subscriber;
