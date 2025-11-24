import { getProducts, getCategories } from "@/lib/products";
import FeaturedCollection from "@/components/FeaturedCollection";
import Search from "@/components/Search";
import ProductFilter from "@/components/ProductFilter";
import ProductSort from "@/components/ProductSort";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined;
  const category = typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined;
  const minPrice = typeof resolvedSearchParams.minPrice === "string" ? Number(resolvedSearchParams.minPrice) : undefined;
  const maxPrice = typeof resolvedSearchParams.maxPrice === "string" ? Number(resolvedSearchParams.maxPrice) : undefined;
  const sort = typeof resolvedSearchParams.sort === "string" ? resolvedSearchParams.sort : undefined;

  const products = await getProducts({
    search,
    category,
    minPrice,
    maxPrice,
    sort,
  });

  const categories = await getCategories();

  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900">
              The Collection
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-light">
              Discover our curated selection of premium essentials, designed for the modern lifestyle.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 sticky top-20 z-30 bg-gray-50/95 backdrop-blur-xl p-4 -mx-4 md:mx-0 md:rounded-2xl md:border md:border-white/20 md:shadow-sm transition-all duration-300">
          <div className="w-full md:w-96">
            <Suspense>
              <Search />
            </Suspense>
          </div>
          <div className="flex items-center self-end md:self-auto">
            <Suspense>
              <ProductSort />
            </Suspense>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-40">
              <Suspense>
                <ProductFilter categories={categories} />
              </Suspense>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-h-[500px]">
            {products.length > 0 ? (
              <div className="animate-fade-in">
                <FeaturedCollection 
                  products={products} 
                  title="" 
                  subtitle="" 
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
