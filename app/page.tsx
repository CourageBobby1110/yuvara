export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import Hero from "@/components/Hero";
import TrendingMarquee from "@/components/TrendingMarquee";
import ProductGridWithLoadMore from "@/components/ProductGridWithLoadMore";
import CategoryCircles from "@/components/CategoryCircles";

import { getProducts, getCategoriesWithImages } from "@/lib/products";
import { getHomepageDeals } from "@/lib/deals";
import { shuffleArray, getValidUrl } from "@/lib/utils";
import dbConnect from "@/lib/db";

export default async function Home() {
  const session = await auth();
  await dbConnect();

  const [categoriesWithImagesRaw, homepageDeals] = await Promise.all([
    getCategoriesWithImages(),
    getHomepageDeals(),
  ]);

  const categoriesWithImages = categoriesWithImagesRaw.map((cat: any) => ({
    ...cat,
    image: getValidUrl(cat.image) || "/placeholder.png",
  }));

  // Time-based seed (changes every 1 hour)
  const currentWindowSeed = Math.floor(Date.now() / (60 * 60 * 1000));
  const filter = { limit: 40, sort: "price_asc" };
  const productsPool = await getProducts(filter);
  const shuffledProducts = shuffleArray(productsPool, currentWindowSeed);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "YuVara Global Store",
    "alternateName": ["YuVara NG", "YuVara Global"],
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

      {/* 1. Top Infinite Global Marquee (Trust & Guarantees Ticker) */}
      <TrendingMarquee />

      {/* 2. Hero Section */}
      <Hero 
        countdownDeals={homepageDeals.countdownDeals}
        limitedDeals={homepageDeals.limitedDeals}
      />

      {/* 3. Category Circles */}
      <div style={{ backgroundColor: "transparent", margin: 0, padding: 0 }}>
        <CategoryCircles categories={categoriesWithImages} />
      </div>

      {/* 4. Main Product Feed Grid */}
      <div
        style={{ width: "100%", margin: "0 auto", padding: "0 2px", boxSizing: "border-box" }}
      >
        <ProductGridWithLoadMore
          initialProducts={shuffledProducts}
          filter={filter}
        />
      </div>
    </main>
  );
}
