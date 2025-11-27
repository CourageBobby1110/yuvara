import dbConnect from "@/lib/db";
import Product, { Product as ProductType } from "@/models/Product";

export interface ProductFilter {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  isFeatured?: boolean;
}

export async function getProducts(filter: ProductFilter = {}) {
  try {
    await dbConnect();

    const pipeline: any[] = [];

    // 1. Match stage
    const matchStage: any = {};

    if (filter.search) {
      matchStage.$or = [
        { name: { $regex: filter.search, $options: "i" } },
        { description: { $regex: filter.search, $options: "i" } },
      ];
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
    let sortStage: any = { createdAt: -1 };
    if (filter.sort === "price_asc") sortStage = { price: 1 };
    if (filter.sort === "price_desc") sortStage = { price: -1 };
    if (filter.sort === "newest") sortStage = { createdAt: -1 };

    pipeline.push({ $sort: sortStage });

    // 6. Limit
    if (filter.limit) {
      pipeline.push({ $limit: filter.limit });
    }

    const products = await Product.aggregate(pipeline);

    // Convert _id and dates to string/ISO string for serialization
    return products.map((product: any) => ({
      ...product,
      _id: product._id.toString(),
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
      variants: product.variants?.map((variant: any) => ({
        ...variant,
        _id: variant._id ? variant._id.toString() : undefined,
      })),
    }));
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
  slug: string
): Promise<ProductType | null> {
  try {
    await dbConnect();
    const product = await Product.findOne({ slug }).lean();
    if (!product) return null;

    return {
      ...(product as unknown as ProductType),
      _id: (product as any)._id.toString(),
      createdAt: (product as any).createdAt?.toISOString(),
      updatedAt: (product as any).updatedAt?.toISOString(),
      variants: (product as any).variants?.map((variant: any) => ({
        ...variant,
        _id: variant._id ? variant._id.toString() : undefined,
      })),
    };
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}
