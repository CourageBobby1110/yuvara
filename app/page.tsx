import { auth } from "@/auth";
import Hero from "@/components/Hero";
import FeaturedCollection from "@/components/FeaturedCollection";
import BrandStory from "@/components/BrandStory";
import TrendingMarquee from "@/components/TrendingMarquee";
import CategoryGrid from "@/components/CategoryGrid";
import Newsletter from "@/components/Newsletter";
import { getProducts } from "@/lib/products";

export default async function Home() {
  const session = await auth();
  const featuredProducts = await getProducts({ limit: 8 });

  return (
    <main>
      <Hero />
      <TrendingMarquee />
      <CategoryGrid />
      <FeaturedCollection products={featuredProducts} title="New Arrivals" />
      <BrandStory />
      <Newsletter />
    </main>
  );
}
