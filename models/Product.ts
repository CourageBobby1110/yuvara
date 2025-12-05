import mongoose, { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      default: 0,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    shippingRates: {
      type: [
        {
          countryCode: { type: String, required: true },
          countryName: { type: String, required: true },
          price: { type: Number, required: true },
          method: { type: String },
          deliveryTime: { type: String },
        },
      ],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    reviewsEnabled: {
      type: Boolean,
      default: true,
    },
    variants: {
      type: [
        {
          color: { type: String, required: true },
          image: { type: String, required: true },
          price: { type: Number, required: true },
          stock: { type: Number, default: 0 },
          size: { type: String }, // Variant Size
          cjVid: { type: String }, // CJ Variant ID
          cjSku: { type: String }, // CJ SKU
          dobaSku: { type: String }, // Doba SKU
          shippingFee: { type: Number, default: 0 },
          shippingFees: {
            type: [
              {
                countryCode: { type: String, required: true },
                fee: { type: Number, required: true },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    productUrl: {
      type: String,
      trim: true,
    },
    cjPid: {
      type: String,
      trim: true,
      index: true,
    },
    dobaId: {
      type: String,
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

const Product = models.Product || model("Product", ProductSchema);

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  videos?: string[];
  reviewsEnabled?: boolean;
  category: string;
  stock: number;
  shippingFee?: number;
  shippingRates?: {
    countryCode: string;
    countryName: string;
    price: number;
    method?: string;
    deliveryTime?: string;
  }[];
  isFeatured: boolean;
  sizes?: string[];
  colors?: string[];
  variants?: {
    color: string;
    image: string;
    price: number;
    stock: number;
  }[];
  productUrl?: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export default Product;
