"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function ProductSort() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-500 hidden sm:block">Sort by</label>
      <div className="relative">
        <select
          className="appearance-none bg-white/50 border border-gray-200 rounded-full px-4 py-2 pr-8 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all duration-200 cursor-pointer hover:bg-white hover:shadow-sm"
          onChange={(e) => handleSortChange(e.target.value)}
          defaultValue={searchParams.get("sort")?.toString()}
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
