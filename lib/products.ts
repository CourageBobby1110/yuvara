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
      const cat = filter.category.trim().toLowerCase();

      if (cat === "men" || cat === "mens" || cat === "men's" || cat === "mens clothing" || cat === "men's fashion" || cat === "men's sartorial") {
        matchStage.$and = [
          ...(matchStage.$and || []),
          {
            $or: [
              { category: { $regex: /(?:^|[\s\/>])Men(?:'s|s)?(?:\s|[\/>]|$)/i } },
              { name: { $regex: /\b(?:Men|Men's|Mens)\b/i } }
            ]
          },
          { category: { $not: /Women/i } },
          { name: { $not: /\b(?:Women|Women's|Womens|Lady|Ladies)\b/i } }
        ];
      } else if (cat === "women" || cat === "womens" || cat === "women's" || cat === "womens clothing" || cat === "women's fashion" || cat === "women's atelier") {
        const womenQuery = {
          $or: [
            { category: { $regex: /Women|Woman|Lady|Ladies|Dress/i } },
            { name: { $regex: /\b(?:Women|Women's|Womens|Lady|Ladies|Dress|Gown|Skirt)\b/i } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(womenQuery);
        } else {
          Object.assign(matchStage, womenQuery);
        }
      } else if (cat === "watches" || cat === "watch" || cat === "horology" || cat === "horology & watches") {
        const watchQuery = {
          $or: [
            { category: { $regex: /Watch|Watches|Horology/i } },
            { name: { $regex: /\b(?:Watch|Watches|Wristwatch|Timepiece|Chronograph)\b/i } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(watchQuery);
        } else {
          Object.assign(matchStage, watchQuery);
        }
      } else if (cat === "jewelry" || cat === "jewellery" || cat === "fine jewelry") {
        const jewelryQuery = {
          $or: [
            { category: { $regex: /Jewel|Necklace|Pendant|Earring|Bracelet|Ring|Zircon|Diamond/i } },
            { name: { $regex: /\b(?:Jewelry|Jewellery|Necklace|Pendant|Earring|Bracelet|Ring|Zircon|Diamond)\b/i } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(jewelryQuery);
        } else {
          Object.assign(matchStage, jewelryQuery);
        }
      } else if (cat === "shoes" || cat === "footwear" || cat === "designer footwear") {
        const shoeQuery = {
          $or: [
            { category: { $regex: /Shoe|Shoes|Sneaker|Boot|Loafer|Flat|Sandal|Slipper|Pump|Footwear/i } },
            { name: { $regex: /\b(?:Shoe|Shoes|Sneakers|Boots|Loafers|Flats|Sandals|Slippers|Pumps|Footwear)\b/i } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(shoeQuery);
        } else {
          Object.assign(matchStage, shoeQuery);
        }
      } else if (cat === "bags" || cat === "luggage" || cat === "accessories" || cat === "eyewear & accs" || cat === "bags & accessories") {
        const bagQuery = {
          $or: [
            { category: { $regex: /Bag|Bags|Luggage|Crossbody|Backpack|Wallet|Purse|Accessory|Accessories|Hat|Cap|Glasses|Sunglasses/i } },
            { name: { $regex: /\b(?:Bag|Bags|Luggage|Crossbody|Backpack|Wallet|Wallets|Purse|Sunglasses|Cap|Hat)\b/i } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(bagQuery);
        } else {
          Object.assign(matchStage, bagQuery);
        }
      } else if (cat === "beauty" || cat === "skincare" || cat === "health, beauty & hair" || cat === "beauty & skincare") {
        const beautyQuery = {
          $or: [
            { category: { $regex: /Health|Beauty|Skin|Facial|Hair|Serum|Mask|Care|Lip/i } },
            { name: { $regex: /\b(?:Beauty|Skin|Facial|Serum|Mask|Hair|Lip|Cleanser|Moisturizer)\b/i } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(beautyQuery);
        } else {
          Object.assign(matchStage, beautyQuery);
        }
      } else if (cat === "home" || cat === "home & living" || cat === "home, garden & furniture" || cat === "furniture") {
        const homeQuery = {
          $or: [
            { category: { $regex: /Home|Garden|Furniture|Storage|Office|Kitchen|Dining|Bedding|Lamp/i } },
            { name: { $regex: /\b(?:Lamp|Decor|Storage|Quilt|Blanket|Glass|Tumbler|Diffuser|Humidifier)\b/i } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(homeQuery);
        } else {
          Object.assign(matchStage, homeQuery);
        }
      } else if (cat === "electronics" || cat === "tech" || cat === "premium electronics" || cat === "tech & gadgets" || cat === "phones & accessories") {
        const techQuery = {
          $or: [
            { category: { $regex: /Phone|Electronic|Computer|Tablet|Office Electronics|Audio/i } },
            { name: { $regex: /\b(?:Phone|Screen|Charger|Laptop|Tablet|Electronic|Speaker|Bluetooth|Wireless|Headphone|Earbuds)\b/i } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(techQuery);
        } else {
          Object.assign(matchStage, techQuery);
        }
      } else {
        const leafName = filter.category.split(/[\/>]/).pop()?.trim() || filter.category.trim();
        const safe = leafName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        const fallbackQuery = {
          $or: [
            { category: { $regex: safe, $options: "i" } },
            { name: { $regex: safe, $options: "i" } }
          ]
        };
        if (matchStage.$and) {
          matchStage.$and.push(fallbackQuery);
        } else {
          Object.assign(matchStage, fallbackQuery);
        }
      }
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
    const categories: (string | null)[] = await Product.distinct("category");
    const validCategories = categories.filter((cat): cat is string => !!cat && cat.trim() !== "");
    
    const shortNames = validCategories.map((cat) => cat.split(/[\/>]/).pop()?.trim() || cat);
    return Array.from(new Set(shortNames)).sort();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getCategoriesWithImages() {
  try {
    await dbConnect();
    
    // Aggregation to get distinct categories with the first image from the first product found
    const categories = await Product.aggregate([
      { $match: { category: { $ne: null, $not: /^\s*$/ } } }, // Filter out empty/null categories
      { $sort: { createdAt: -1 } }, 
      {
        $group: {
          _id: "$category",
          image: { $first: { $arrayElemAt: ["$images", 0] } },
        }
      },
      { $limit: 20 } // Limit to top 20 subcategories
    ]);

    return categories.map(cat => ({
      name: cat._id.split(/[\/>]/).pop()?.trim() || cat._id,
      fullName: cat._id,
      image: cat.image || "/placeholder.png"
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching categories with images:", error);
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
