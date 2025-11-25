export const dynamic = "force-dynamic";
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

  // Fetch site settings
  const SiteSettings = (await import("@/models/SiteSettings")).default;
  await (await import("@/lib/db")).default();

  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = {
      categoryImages: {
        men: "/men-category.jpg",
        women: "/women-category.jpg",
        accessories: "/accessories-category.jpg",
      },
      brandStoryImage: "/brand-story.png",
    };
  }

  return (
    <main>
      <Hero />
      <TrendingMarquee />
      <CategoryGrid images={settings.categoryImages} />
      <FeaturedCollection products={featuredProducts} title="New Arrivals" />
      <BrandStory image={settings.brandStoryImage} />
      <Newsletter />
    </main>
  );
}
