export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import Hero from "@/components/Hero";
import ProductGridWithLoadMore from "@/components/ProductGridWithLoadMore";
import TrendingMarquee from "@/components/TrendingMarquee";

import { getProducts, getCategories, getCategoriesWithImages } from "@/lib/products";
import { shuffleArray, getValidUrl } from "@/lib/utils";
import SiteSettings from "@/models/SiteSettings";
import dbConnect from "@/lib/db";
import CategoryCircles from "@/components/CategoryCircles";

export default async function Home() {
  const session = await auth();
  await dbConnect();

  // Fetch data
  const categoriesOriginal = await getCategories();
  const categoriesWithImagesRaw = await getCategoriesWithImages();
  const categoriesWithImages = categoriesWithImagesRaw.map((cat: any) => ({
    ...cat,
    image: getValidUrl(cat.image) || "/placeholder.png",
  }));

  const settings = await SiteSettings.findOne().lean();
  const heroImage = settings?.heroImageUrl || "/hero-shoe-minimalist.png";

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

      <Hero categories={categoriesOriginal.slice(0, 15)} heroImage={heroImage} />
      
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
