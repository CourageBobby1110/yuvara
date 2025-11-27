"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./Wishlist.module.css";

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
  const { version, toggleWishlist } = useWishlistStore(); // Subscribe to version changes
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, [version]); // Re-fetch when version changes

  const fetchWishlist = async () => {
    try {
      // Add cache: no-store to ensure fresh data
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      const data = await res.json();
      // Filter out items where product might be null (deleted)
      const validItems = data.filter((item: WishlistItem) => item.product);
      setItems(validItems);

      // Sync with global store
      const ids = new Set<string>(
        validItems.map((item: WishlistItem) => item.product._id)
      );
      useWishlistStore.setState({ items: ids });
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    await toggleWishlist(productId);
    // Local state update will happen via useEffect on version change,
    // but for immediate UI feedback we can filter locally too if needed.
    // However, since toggleWishlist updates 'version', the useEffect will trigger a refetch.
    // To make it instant, we can optimistically filter.
    setItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const handleAddToCart = (item: WishlistItem) => {
    // Filter out empty strings or whitespace-only strings
    const validSizes = item.product.sizes.filter(
      (s) => s && s.trim().length > 0
    );
    const validColors = item.product.colors.filter(
      (c) => c && c.trim().length > 0
    );

    // Only require selection if valid options are available
    if (validSizes.length > 0 && !item.selectedSize) {
      alert("Please select a size");
      return;
    }
    if (validColors.length > 0 && !item.selectedColor) {
      alert("Please select a color");
      return;
    }

    addItem({
      id: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images?.[0] || "/placeholder.png",
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

  if (loading) return <div className={styles.loadingContainer}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>My Wishlist ({items.length})</h1>

        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>Your wishlist is empty.</p>
            <Link href="/collections" className={styles.emptyLink}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <div key={item._id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <Image
                    src={item.product.images?.[0] || "/placeholder.png"}
                    alt={item.product.name}
                    fill
                    className={styles.image}
                  />
                  <button
                    onClick={() => handleRemove(item.product._id)}
                    className={styles.removeButton}
                  >
                    <svg
                      className={styles.removeIcon}
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

                <div className={styles.content}>
                  <Link
                    href={`/product/${item.product.slug}`}
                    className={styles.productLink}
                  >
                    <h3 className={styles.productName}>{item.product.name}</h3>
                  </Link>
                  <p className={styles.price}>
                    {formatPrice(item.product.price)}
                  </p>

                  <div className={styles.options}>
                    {/* Size Selector */}
                    {item.product.sizes.length > 0 && (
                      <div className={styles.optionGroup}>
                        <label className={styles.optionLabel}>Size</label>
                        <select
                          value={item.selectedSize || ""}
                          onChange={(e) =>
                            updatePreference(
                              item._id,
                              "selectedSize",
                              e.target.value
                            )
                          }
                          className={styles.select}
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
                      <div className={styles.optionGroup}>
                        <label className={styles.optionLabel}>Color</label>
                        <select
                          value={item.selectedColor || ""}
                          onChange={(e) =>
                            updatePreference(
                              item._id,
                              "selectedColor",
                              e.target.value
                            )
                          }
                          className={styles.select}
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
                    disabled={item.product.stock <= 0}
                    className={`${styles.addToCartButton} ${
                      item.product.stock <= 0 ? styles.disabled : ""
                    }`}
                    style={
                      item.product.stock <= 0
                        ? { opacity: 0.5, cursor: "not-allowed" }
                        : {}
                    }
                  >
                    <svg
                      className={styles.cartIcon}
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
                    {item.product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
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
