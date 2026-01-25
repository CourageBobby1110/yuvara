"use server";

import { getProducts, ProductFilter } from "@/lib/products";

export async function fetchMoreProducts(
  filter: ProductFilter,
  skip: number,
  limit: number,
) {
  try {
    const products = await getProducts({
      ...filter,
      skip,
      limit,
    });
    return products;
  } catch (error) {
    console.error("Error fetching more products:", error);
    return [];
  }
}
