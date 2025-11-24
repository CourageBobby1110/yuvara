import mongoose, { Schema, model, models } from "mongoose";

const WishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    selectedSize: {
      type: String,
    },
    selectedColor: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound index to ensure a user can't add the same product multiple times (unless we want to allow different variants?)
// For now, let's assume one entry per product per user, and they can update the variant.
WishlistSchema.index({ user: 1, product: 1 }, { unique: true });

const Wishlist = models.Wishlist || model("Wishlist", WishlistSchema);

export default Wishlist;
