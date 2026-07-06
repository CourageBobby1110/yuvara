import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.URL || "https://yuvara.com.ng";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/checkout/",
        "/orders/",
        "/profile/",
        "/wishlist/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
