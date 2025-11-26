export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import Hero from "@/components/Hero";
import FeaturedCollection from "@/components/FeaturedCollection";
import TrendingMarquee from "@/components/TrendingMarquee";
import Newsletter from "@/components/Newsletter";
import { getProducts } from "@/lib/products";

export default async function Home() {
  const session = await auth();

  // Fetch different product sets for the marketplace feel
  const newArrivals = await getProducts({ limit: 8, sort: "newest" });
  const bestSellers = await getProducts({ limit: 8, sort: "price_desc" }); // Proxy for best sellers
  const featured = await getProducts({ limit: 4, isFeatured: true });

  return (
    <main
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        minHeight: "100vh",
        paddingBottom: "2rem",
      }}
    >
      <Hero />
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
