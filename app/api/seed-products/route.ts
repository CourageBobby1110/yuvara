import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Check if products already exist
    const existingCount = await Product.countDocuments();
    
    if (existingCount > 0) {
      // Update all existing products to be featured
      await Product.updateMany({}, { isFeatured: true });
      const featuredCount = await Product.countDocuments({ isFeatured: true });
      return NextResponse.json({
        message: "Products already exist. Updated all to featured.",
        total: existingCount,
        featured: featuredCount,
      });
    }

    const sampleProducts = [
      {
        name: "Classic Leather Sneaker",
        slug: "classic-leather-sneaker",
        description: "Timeless design meets modern comfort. Handcrafted from premium Italian leather.",
        price: 299,
        category: "Sneakers",
        images: ["/placeholder.png"],
        stock: 50,
        isFeatured: true,
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Black", "White", "Brown"],
      },
      {
        name: "Luxury Suede Loafer",
        slug: "luxury-suede-loafer",
        description: "Sophisticated elegance for the discerning gentleman. Crafted from the finest suede.",
        price: 399,
        category: "Loafers",
        images: ["/placeholder.png"],
        stock: 30,
        isFeatured: true,
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Navy", "Burgundy", "Tan"],
      },
      {
        name: "Premium Canvas High-Top",
        slug: "premium-canvas-high-top",
        description: "Street style elevated. Premium canvas with leather accents.",
        price: 249,
        category: "Sneakers",
        images: ["/placeholder.png"],
        stock: 60,
        isFeatured: true,
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Black", "White", "Olive"],
      },
      {
        name: "Artisan Oxford",
        slug: "artisan-oxford",
        description: "Classic craftsmanship for formal occasions. Hand-stitched perfection.",
        price: 449,
        category: "Oxfords",
        images: ["/placeholder.png"],
        stock: 25,
        isFeatured: true,
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Black", "Brown"],
      },
      {
        name: "Modern Slip-On",
        slug: "modern-slip-on",
        description: "Effortless style for the modern professional. Comfort meets sophistication.",
        price: 279,
        category: "Slip-Ons",
        images: ["/placeholder.png"],
        stock: 40,
        isFeatured: true,
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Black", "Navy", "Grey"],
      },
      {
        name: "Heritage Boot",
        slug: "heritage-boot",
        description: "Rugged elegance that stands the test of time. Premium leather construction.",
        price: 499,
        category: "Boots",
        images: ["/placeholder.png"],
        stock: 20,
        isFeatured: true,
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Brown", "Black"],
      },
      {
        name: "Minimalist Trainer",
        slug: "minimalist-trainer",
        description: "Clean lines, maximum comfort. The perfect everyday sneaker.",
        price: 229,
        category: "Sneakers",
        images: ["/placeholder.png"],
        stock: 70,
        isFeatured: true,
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["White", "Black", "Grey"],
      },
      {
        name: "Designer Derby",
        slug: "designer-derby",
        description: "Contemporary design with traditional craftsmanship. A statement piece.",
        price: 429,
        category: "Derbys",
        images: ["/placeholder.png"],
        stock: 15,
        isFeatured: true,
        sizes: ["7", "8", "9", "10", "11", "12"],
        colors: ["Black", "Burgundy"],
      },
    ];

    await Product.insertMany(sampleProducts);
    const featuredCount = await Product.countDocuments({ isFeatured: true });

    return NextResponse.json({
      message: "Successfully seeded products",
      total: sampleProducts.length,
      featured: featuredCount,
    });
  } catch (error: any) {
    console.error("Error seeding products:", error);
    return NextResponse.json(
      { error: "Failed to seed products", details: error.message },
      { status: 500 }
    );
  }
}
