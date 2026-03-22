"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useCurrency } from "@/context/CurrencyContext";

interface FavoriteItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    slug: string;
  };
  selectedSize?: string;
  selectedColor?: string;
  createdAt: string;
}

import styles from "./AdminFavorites.module.css";

export default function AdminFavoritesPage() {
  const { formatPrice } = useCurrency();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/admin/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      } else {
        toast.error("Failed to fetch favorites");
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Error fetching favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (item: FavoriteItem) => {
    if (!confirm(`Send promotional email to ${item.user.name}?`)) return;

    const rateNGN = 1500; // Default rate if context not available, but we can try to get it from context if exposed
    const priceInNGN = item.product.price * rateNGN;

    setSendingEmail(item._id);
    try {
      const res = await fetch("/api/admin/favorites/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: item.user.email,
          userName: item.user.name,
          productName: item.product.name,
          productImage: item.product.images[0],
          productPrice: priceInNGN,
          productSlug: item.product.slug,
        }),
      });

      if (res.ok) {
        toast.success(`Email sent to ${item.user.email}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Error sending email");
    } finally {
      setSendingEmail(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Wishlists</h1>
        <p className={styles.subtitle}>
          Premium insights into user trends and desired collections.
        </p>
      </div>

      <div className={styles.mobileCardList}>
        {favorites.length === 0 ? (
          <div className={styles.emptyState}>No wishlist items trending yet.</div>
        ) : (
          favorites.map((item) => {
            if (!item.product || !item.user) return null;
            return (
              <div key={item._id} className={styles.favoriteCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardImageWrapper}>
                    <Image
                      src={item.product.images?.[0] || "/placeholder.png"}
                      alt={item.product.name}
                      fill
                      className={styles.productImage}
                    />
                  </div>
                  <div className={styles.cardProductInfo}>
                    <p className={styles.cardProductName}>
                      {item.product.name}
                    </p>
                    <p className={styles.cardProductPrice}>
                      {formatPrice(item.product.price)}
                    </p>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Investor</span>
                    <p className={styles.cardUserName}>{item.user.name}</p>
                    <p className={styles.cardUserEmail}>{item.user.email}</p>
                  </div>

                  {(item.selectedSize || item.selectedColor) && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Selection</span>
                      <div className={styles.cardValue}>
                        {item.selectedSize && (
                          <span className={styles.variantBadge}>
                            {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className={styles.variantBadge}>
                            {item.selectedColor}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.cardDate}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => handleSendEmail(item)}
                    disabled={sendingEmail === item._id}
                    className={styles.sendButton}
                  >
                    {sendingEmail === item._id && (
                      <svg className={styles.spinner} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4" />
                      </svg>
                    )}
                    {sendingEmail === item._id ? "Sending..." : "Engage"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Product</th>
                <th className={styles.th}>User</th>
                <th className={styles.th}>Selection</th>
                <th className={styles.th}>Date</th>
                <th className={`${styles.th} ${styles.thRight}`}>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {favorites.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    No wishlist items found.
                  </td>
                </tr>
              ) : (
                favorites.map((item) => {
                  if (!item.product || !item.user) return null;
                  return (
                    <tr key={item._id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.productCell}>
                          <div className={styles.imageWrapper}>
                            <Image
                              src={
                                item.product.images?.[0] || "/placeholder.png"
                              }
                              alt={item.product.name}
                              fill
                              className={styles.productImage}
                            />
                          </div>
                          <div className={styles.productInfo}>
                            <p className={styles.productName}>
                              {item.product.name}
                            </p>
                            <p className={styles.productPrice}>
                              {formatPrice(item.product.price)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.userInfo}>
                          <p className={styles.userName}>{item.user.name}</p>
                          <p className={styles.userEmail}>{item.user.email}</p>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.variantInfo}>
                          {item.selectedSize && (
                            <span className={styles.variantBadge}>
                              {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className={styles.variantBadge}>
                              {item.selectedColor}
                            </span>
                          )}
                          {!item.selectedSize && !item.selectedColor && "-"}
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.dateText}`}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`${styles.td} ${styles.tdRight}`}>
                        <button
                          onClick={() => handleSendEmail(item)}
                          disabled={sendingEmail === item._id}
                          className={styles.sendButton}
                        >
                          {sendingEmail === item._id && (
                            <svg className={styles.spinner} viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4" />
                            </svg>
                          )}
                          {sendingEmail === item._id ? "Sending..." : "Send Offer"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
