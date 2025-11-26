import { getProducts, getCategories } from "@/lib/products";
import FeaturedCollection from "@/components/FeaturedCollection";
import Search from "@/components/Search";
import ProductFilter from "@/components/ProductFilter";
import ProductSort from "@/components/ProductSort";
import { Suspense } from "react";
import styles from "./Collections.module.css";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections | Yuvara",
  description:
    "Browse our extensive collection of fashion, electronics, and home goods.",
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const search =
    typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : undefined;
  const category =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : undefined;
  const minPrice =
    typeof resolvedSearchParams.minPrice === "string"
      ? Number(resolvedSearchParams.minPrice)
      : undefined;
  const maxPrice =
    typeof resolvedSearchParams.maxPrice === "string"
      ? Number(resolvedSearchParams.maxPrice)
      : undefined;
  const sort =
    typeof resolvedSearchParams.sort === "string"
      ? resolvedSearchParams.sort
      : undefined;

  const products = await getProducts({
    search,
    category,
    minPrice,
    maxPrice,
    sort,
  });

  const categories = await getCategories();

  return (
    <main className={styles.pageContainer}>
      {/* Premium Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className="inline-block">
            <span className={styles.label}>Curated Selection</span>
          </div>
          <h1 className={styles.title}>The Collection</h1>
          <p className={styles.description}>
            Discover our meticulously curated selection of premium essentials,
            <br className="hidden md:block" />
            designed for the modern lifestyle.
          </p>
        </div>
      </section>

      <div className={styles.contentContainer}>
        <div className={styles.layout}>
          {/* Sidebar Section - Sticky Filters */}
          <aside className={styles.sidebar}>
            {/* Search and Sort for Mobile */}
            <div className={styles.mobileControls}>
              <Suspense>
                <Search />
              </Suspense>
              <div className={styles.mobileControlsRow}>
                <span className={styles.productCount}>
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"}
                </span>
                <Suspense>
                  <ProductSort />
                </Suspense>
              </div>
            </div>

            {/* Filters */}
            <Suspense>
              <ProductFilter categories={categories} />
            </Suspense>
          </aside>

          {/* Main Content - Products */}
          <div className={styles.mainContent}>
            {/* Desktop Controls Bar */}
            <div className={styles.controlsBar}>
              <div className={styles.searchContainer}>
                <Suspense>
                  <Search />
                </Suspense>
              </div>
              <div className={styles.sortContainer}>
                <div className={styles.productCount}>
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"}
                </div>
                <Suspense>
                  <ProductSort />
                </Suspense>
              </div>
            </div>

            {/* Product Grid */}
            <section>
              {products.length > 0 ? (
                <div className="animate-fade-in">
                  <FeaturedCollection
                    products={products}
                    title=""
                    subtitle=""
                  />
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIconWrapper}>
                    <svg
                      className={styles.emptyIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h3 className={styles.emptyTitle}>No products found</h3>
                  <p className={styles.emptyText}>
                    Try adjusting your search or filters to find what you're
                    looking for.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
