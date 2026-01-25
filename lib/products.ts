import dbConnect from "@/lib/db";
import Product, { Product as ProductType } from "@/models/Product";
import { PipelineStage } from "mongoose";

export interface ProductFilter {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  skip?: number;
  isFeatured?: boolean;
}

export async function getProducts(filter: ProductFilter = {}) {
  try {
    await dbConnect();

    const pipeline: PipelineStage[] = [];

    // 1. Match stage
    const matchStage: Record<string, any> = {};

    if (filter.search) {
      const searchTerms = filter.search.trim().split(/\s+/).filter(Boolean);
      if (searchTerms.length > 0) {
        matchStage.$and = searchTerms.map((term) => ({
          $or: [
            {
              name: {
                $regex: term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
                $options: "i",
              },
            },
            {
              description: {
                $regex: term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
                $options: "i",
              },
            },
          ],
        }));
      }
    }

    if (filter.category && filter.category !== "all") {
      matchStage.category = filter.category;
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      matchStage.price = {};
      if (filter.minPrice !== undefined)
        matchStage.price.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined)
        matchStage.price.$lte = filter.maxPrice;
    }

    if (filter.isFeatured !== undefined) {
      matchStage.isFeatured = filter.isFeatured;
    }

    pipeline.push({ $match: matchStage });

    // 2. Lookup Reviews
    pipeline.push({
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "product",
        as: "reviews",
      },
    });

    // 3. Add computed fields
    pipeline.push({
      $addFields: {
        reviewCount: { $size: "$reviews" },
        averageRating: {
          $cond: {
            if: { $eq: [{ $size: "$reviews" }, 0] },
            then: 0,
            else: { $avg: "$reviews.rating" },
          },
        },
      },
    });

    // 4. Remove reviews array to keep payload light
    pipeline.push({
      $project: {
        reviews: 0,
      },
    });

    // 5. Sort
    let sortStage: Record<string, 1 | -1> = { createdAt: -1 };
    if (filter.sort === "price_asc") sortStage = { price: 1 };
    if (filter.sort === "price_desc") sortStage = { price: -1 };
    if (filter.sort === "newest") sortStage = { createdAt: -1 };

    pipeline.push({ $sort: sortStage });

    // 6. Skip and Limit
    if (filter.skip) {
      pipeline.push({ $skip: filter.skip });
    }

    if (filter.limit) {
      pipeline.push({ $limit: filter.limit });
    }

    const products = await Product.aggregate(pipeline);

    return products.map((product: any) => {
      const p = { ...product };

      // Ensure _id is string
      if (p._id) p._id = p._id.toString();
      if (p.createdAt) p.createdAt = p.createdAt.toISOString();
      if (p.updatedAt) p.updatedAt = p.updatedAt.toISOString();

      // Clean legacy shippingFees to avoid serialization errors if they exist in DB
      delete p.shippingFees;

      if (p.variants) {
        p.variants = p.variants.map((variant: any) => {
          const v = { ...variant };
          if (v._id) v._id = v._id.toString();

          // Clean legacy variant shippingFees
          delete v.shippingFees;

          if (v.shippingRates) {
            v.shippingRates = v.shippingRates.map((rate: any) => ({
              ...rate,
              _id: rate._id ? rate._id.toString() : undefined,
            }));
          }
          return v;
        });
      }

      if (p.shippingRates) {
        p.shippingRates = p.shippingRates.map((rate: any) => ({
          ...rate,
          _id: rate._id ? rate._id.toString() : undefined,
        }));
      }

      return p;
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getCategories() {
  try {
    await dbConnect();
    const categories = await Product.distinct("category");
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductType | null> {
  try {
    await dbConnect();
    const product = await Product.findOne({ slug }).lean();
    if (!product) return null;

    // Sanitize product object
    const p = { ...product } as any;
    if (p._id) p._id = p._id.toString();
    if (p.createdAt) p.createdAt = p.createdAt.toISOString();
    if (p.updatedAt) p.updatedAt = p.updatedAt.toISOString();

    // Legacy cleanup
    delete p.shippingFees;

    if (p.variants) {
      p.variants = p.variants.map((variant: any) => {
        const v = { ...variant };
        if (v._id) v._id = v._id.toString();
        delete v.shippingFees;

        if (v.shippingRates) {
          v.shippingRates = v.shippingRates.map((rate: any) => ({
            ...rate,
            _id: rate._id ? rate._id.toString() : undefined,
          }));
        }
        return v;
      });
    }

    if (p.shippingRates) {
      p.shippingRates = p.shippingRates.map((rate: any) => ({
        ...rate,
        _id: rate._id ? rate._id.toString() : undefined,
      }));
    }

    return p;
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}
