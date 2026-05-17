import mongoose, { Schema, model, models } from "mongoose";

const UserActivitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    email: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: ["app_open", "page_view", "scroll", "abandoned_checkout", "wishlist_add"],
    },
    metadata: {
      type: Schema.Types.Map,
      of: String,
    },
  },
  { timestamps: true }
);

const UserActivity = models.UserActivity || model("UserActivity", UserActivitySchema);
export default UserActivity;
