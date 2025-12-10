export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import Hero from "@/components/Hero";
import FeaturedCollection from "@/components/FeaturedCollection";
import TrendingMarquee from "@/components/TrendingMarquee";
import Newsletter from "@/components/Newsletter";
import { getProducts, getCategories } from "@/lib/products";
import { shuffleArray } from "@/lib/utils";
import SiteSettings from "@/models/SiteSettings";
import dbConnect from "@/lib/db";

export default async function Home() {
  const session = await auth();
  await dbConnect();

  // Fetch data
  const categories = await getCategories();
  const settings = await SiteSettings.findOne().lean();
  const heroImage = settings?.heroImageUrl || "/hero-shoe-minimalist.png";

  // Time-based seed (changes every 30 mins)
  const currentWindowSeed = Math.floor(Date.now() / (30 * 60 * 1000));

  // Fetch larger pools for shuffling
  const newArrivalsPool = await getProducts({ limit: 48, sort: "newest" });
  const bestSellersPool = await getProducts({ limit: 48, sort: "price_desc" }); // Proxy for best sellers
  const featuredPool = await getProducts({ limit: 24, isFeatured: true });

  // Shuffle and slice
  const newArrivals = shuffleArray(newArrivalsPool, currentWindowSeed).slice(
    0,
    8
  );
  const bestSellers = shuffleArray(
    bestSellersPool,
    currentWindowSeed + 1
  ).slice(0, 8);
  const featured = shuffleArray(featuredPool, currentWindowSeed + 2).slice(
    0,
    4
  );

  return (
    <main
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "100vh",
        paddingBottom: "2rem",
      }}
    >
      <Hero categories={categories.slice(0, 15)} heroImage={heroImage} />
      <TrendingMarquee />

      <div
        style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.5rem" }}
      >
        <FeaturedCollection products={newArrivals} title="New Arrivals" />
        <FeaturedCollection products={bestSellers} title="Best Sellers" />
        <FeaturedCollection products={featured} title="Featured Products" />
      </div>

      <Newsletter />
    </main>
  );
}
