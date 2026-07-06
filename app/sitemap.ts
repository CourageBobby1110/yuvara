import { MetadataRoute } from "next";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.URL || "https://yuvara.com.ng";

  // Static routes of the website
  const staticPages = [
    "",
    "/about",
    "/accessibility",
    "/affiliate-program",
    "/collections",
    "/download",
    "/gift-cards",
    "/invest",
    "/size-guide",
    "/privacy",
    "/terms",
    "/contact",
    "/faq",
    "/shipping-returns",
  ];

  const routes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    await dbConnect();
    // Fetch all active products
    const products = await Product.find({}, "slug updatedAt").lean();

    const productRoutes = products.map((product: any) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...routes, ...productRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap:", error);
    return routes;
  }
}
