"use client";

import { useState, useEffect } from "react";
import AdminLoader from "@/components/AdminLoader";
import styles from "./AdminReviews.module.css";
import { Star, Trash2 } from "lucide-react";

interface Review {
  _id: string;
  user: {
    name: string;
    image: string;
  };
  product: {
    _id: string;
    name: string;
    image: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReviews(reviews.filter((r) => r._id !== id));
      } else {
        alert("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review", error);
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Product Reviews</h1>

      <div className={styles.reviewsGrid}>
        {reviews.map((review) => (
          <div key={review._id} className={styles.reviewCard}>
            <div className={styles.cardHeader}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {review.user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <div className={styles.userName}>
                    {review.user?.name || "Anonymous"}
                  </div>
                  <div className={styles.date}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(review._id)}
                className={styles.deleteButton}
                title="Delete Review"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className={styles.rating}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < review.rating ? "#fbbf24" : "none"}
                  color={i < review.rating ? "#fbbf24" : "#e5e7eb"}
                />
              ))}
            </div>

            <p className={styles.comment}>{review.comment}</p>

            <div className={styles.productInfo}>
              <span className={styles.productLabel}>Product:</span>
              <span className={styles.productName}>
                {review.product?.name || "Unknown Product"}
              </span>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className={styles.emptyState}>No reviews found.</div>
        )}
      </div>
    </div>
  );
}
