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
        <h1 className={styles.title}>User Favorites</h1>
        <p className={styles.subtitle}>
          View and manage items users have added to their wishlist.
        </p>
      </div>

      <div className={styles.mobileCardList}>
        {favorites.length === 0 ? (
          <div className={styles.emptyState}>No favorites found.</div>
        ) : (
          favorites.map((item) => (
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
                  <p className={styles.cardProductName}>{item.product.name}</p>
                  <p className={styles.cardProductPrice}>
                    {formatPrice(item.product.price)}
                  </p>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardRow}>
                  <span className={styles.cardLabel}>User</span>
                  <div className={styles.cardValue}>
                    <p className={styles.cardUserName}>{item.user.name}</p>
                    <p className={styles.cardUserEmail}>{item.user.email}</p>
                  </div>
                </div>

                {(item.selectedSize || item.selectedColor) && (
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Variant</span>
                    <div className={styles.cardValue}>
                      {item.selectedSize && (
                        <span className={styles.variantBadge}>
                          Size: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedColor && (
                        <span className={styles.variantBadge}>
                          Color: {item.selectedColor}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleSendEmail(item)}
                  disabled={sendingEmail === item._id}
                  className={styles.sendButton}
                >
                  {sendingEmail === item._id ? (
                    <>
                      <svg
                        className={styles.spinner}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className={styles.spinnerCircle}
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className={styles.spinnerPath}
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Product</th>
                <th className={styles.th}>User</th>
                <th className={styles.th}>Variant</th>
                <th className={styles.th}>Date Added</th>
                <th className={`${styles.th} ${styles.thRight}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {favorites.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.emptyState}>
                    No favorites found.
                  </td>
                </tr>
              ) : (
                favorites.map((item) => (
                  <tr key={item._id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.productCell}>
                        <div className={styles.imageWrapper}>
                          <Image
                            src={item.product.images?.[0] || "/placeholder.png"}
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
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className={styles.variantBadge}>
                            Color: {item.selectedColor}
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
                        {sendingEmail === item._id ? (
                          <>
                            <svg
                              className={styles.spinner}
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className={styles.spinnerCircle}
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className={styles.spinnerPath}
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Sending...
                          </>
                        ) : (
                          "Send Email"
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
