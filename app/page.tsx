export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import Hero from "@/components/Hero";
import ProductGridWithLoadMore from "@/components/ProductGridWithLoadMore";
import TrendingMarquee from "@/components/TrendingMarquee";
import CategoryCircles from "@/components/CategoryCircles";

import { getProducts, getCategoriesWithImages } from "@/lib/products";
import { shuffleArray, getValidUrl } from "@/lib/utils";
import SiteSettings from "@/models/SiteSettings";
import dbConnect from "@/lib/db";

export default async function Home() {
  const session = await auth();
  await dbConnect();

  const categoriesWithImagesRaw = await getCategoriesWithImages();
  const categoriesWithImages = categoriesWithImagesRaw.map((cat: any) => ({
    ...cat,
    image: getValidUrl(cat.image) || "/placeholder.png",
  }));

  const settings = await SiteSettings.findOne().lean();
  const heroImage = settings?.heroImageUrl || "/hero-shoe-minimalist.png";

  // Fetch latest products to extract high-definition images for the Hero carousel
  const carouselFilter = { limit: 80, sort: "created_desc" };
  const latestProducts = await getProducts(carouselFilter);

  const productImages: string[] = [];
  latestProducts.forEach((p: any) => {
    // Collect main image if valid
    const mainImg = getValidUrl(p.images?.[0] || p.image);
    if (mainImg && !productImages.includes(mainImg) && !mainImg.includes("placeholder")) {
      productImages.push(mainImg);
    }
    // Collect variant images if valid
    if (p.variants) {
      p.variants.forEach((v: any) => {
        const varImg = getValidUrl(v.image);
        if (varImg && !productImages.includes(varImg) && !varImg.includes("placeholder")) {
          productImages.push(varImg);
        }
      });
    }
  });

  // Time-based seed changing every 7 days (7 * 24 * 60 * 60 * 1000 ms)
  const sevenDaySeed = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const shuffledImages = shuffleArray(productImages, sevenDaySeed);
  const carouselImages = shuffledImages.slice(0, 10); // Pick 10 high-quality images

  const fallbackImages = [
    heroImage,
    "/hero-shoe-minimalist.png",
    "/hero-shoe.png",
  ].filter((img): img is string => typeof img === "string" && !!img);

  const finalCarouselImages = carouselImages.length > 0 ? carouselImages : fallbackImages;

  // Time-based seed (changes every 1 hour)
  const currentWindowSeed = Math.floor(Date.now() / (60 * 60 * 1000));

  // Fetch initial batch of 40 cheapest products
  const filter = { limit: 40, sort: "price_asc" };
  const productsPool = await getProducts(filter);

  // Randomly shuffle the pool using the 1-hour seed
  const shuffledProducts = shuffleArray(productsPool, currentWindowSeed);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "YuVara Nigeria",
    "alternateName": ["YuVara", "YuVara NG"],
    "url": "https://yuvara.com.ng",
  };

  return (
    <main
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "100vh",
        paddingBottom: "2rem",
        width: "100%",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visually hidden h1 for search engine site-name recognition and accessibility */}
      <h1 style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
        YuVara Nigeria
      </h1>

      <Hero carouselImages={finalCarouselImages} />

      <TrendingMarquee />

      <div style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <CategoryCircles categories={categoriesWithImages} />
      </div>

      <div
        style={{ width: "100%", margin: "0 auto", padding: "0 0.25rem", boxSizing: "border-box" }}
      >
        <ProductGridWithLoadMore
          initialProducts={shuffledProducts}
          filter={filter}
        />
      </div>

    </main>
  );
}
