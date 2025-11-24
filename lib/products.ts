import dbConnect from "@/lib/db";
import Product from "@/models/Product";

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

    const query: any = {};

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: "i" } },
        { description: { $regex: filter.search, $options: "i" } },
      ];
    }

    if (filter.category && filter.category !== "all") {
      query.category = filter.category;
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {};
      if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
    }

    if (filter.isFeatured !== undefined) {
      query.isFeatured = filter.isFeatured;
    }

    let sortOptions: any = { createdAt: -1 };
    if (filter.sort === "price_asc") sortOptions = { price: 1 };
    if (filter.sort === "price_desc") sortOptions = { price: -1 };
    if (filter.sort === "newest") sortOptions = { createdAt: -1 };

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(filter.limit || 0)
      .lean();

    // Convert _id and dates to string/ISO string for serialization
    return products.map((product: any) => ({
      ...product,
      _id: product._id.toString(),
      createdAt: product.createdAt?.toISOString(),
      updatedAt: product.updatedAt?.toISOString(),
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

export async function getProductBySlug(slug: string) {
  try {
    await dbConnect();
    const product = await Product.findOne({ slug }).lean();
    if (!product) return null;
    
    return {
      ...product,
      _id: (product as any)._id.toString(),
      createdAt: (product as any).createdAt?.toISOString(),
      updatedAt: (product as any).updatedAt?.toISOString(),
    };
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}
