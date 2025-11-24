"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useCurrency } from "@/context/CurrencyContext";

interface WishlistItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    slug: string;
    sizes: string[];
    colors: string[];
    stock: number;
  };
  selectedSize?: string;
  selectedColor?: string;
}

export default function WishlistClient() {
  const { addItem } = useCartStore();
  const { formatPrice } = useCurrency();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await fetch("/api/wishlist");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems(items.filter((item) => item.product._id !== productId));
      }
    } catch (error) {
      console.error("Failed to remove item", error);
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (!item.selectedSize && item.product.sizes.length > 0) {
      alert("Please select a size");
      return;
    }
    if (!item.selectedColor && item.product.colors.length > 0) {
      alert("Please select a color");
      return;
    }

    addItem({
      id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images[0],
      slug: item.product.slug,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    });
    alert("Added to cart!");
  };

  const updatePreference = async (
    itemId: string,
    field: "selectedSize" | "selectedColor",
    value: string
  ) => {
    // Optimistic update
    setItems(
      items.map((item) =>
        item._id === itemId ? { ...item, [field]: value } : item
      )
    );

    // Persist to DB (optional, but good for UX if they leave and come back)
    const item = items.find((i) => i._id === itemId);
    if (item) {
      try {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: item.product._id,
            selectedSize: field === "selectedSize" ? value : item.selectedSize,
            selectedColor:
              field === "selectedColor" ? value : item.selectedColor,
          }),
        });
      } catch (error) {
        console.error("Failed to update preference", error);
      }
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black mb-8">
          My Wishlist ({items.length})
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500 mb-6">Your wishlist is empty.</p>
            <Link href="/collections" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group"
              >
                <div className="relative h-64 bg-gray-100">
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={() => handleRemove(item.product._id)}
                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="p-6">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="block mb-2"
                  >
                    <h3 className="font-bold text-lg text-gray-900 hover:text-gray-600 transition-colors line-clamp-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-900 font-medium mb-4">
                    {formatPrice(item.product.price)}
                  </p>

                  <div className="space-y-3 mb-6">
                    {/* Size Selector */}
                    {item.product.sizes.length > 0 && (
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">
                          Size
                        </label>
                        <select
                          value={item.selectedSize || ""}
                          onChange={(e) =>
                            updatePreference(
                              item._id,
                              "selectedSize",
                              e.target.value
                            )
                          }
                          className="w-full text-sm border-gray-200 rounded-lg focus:border-black focus:ring-black"
                        >
                          <option value="">Select Size</option>
                          {item.product.sizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Color Selector */}
                    {item.product.colors.length > 0 && (
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">
                          Color
                        </label>
                        <select
                          value={item.selectedColor || ""}
                          onChange={(e) =>
                            updatePreference(
                              item._id,
                              "selectedColor",
                              e.target.value
                            )
                          }
                          className="w-full text-sm border-gray-200 rounded-lg focus:border-black focus:ring-black"
                        >
                          <option value="">Select Color</option>
                          {item.product.colors.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
