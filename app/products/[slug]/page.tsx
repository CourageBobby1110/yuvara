"use client";

import { useState, useEffect } from "react";
import AddToCart from "@/components/AddToCart";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";
import styles from "./Product.module.css";

interface ProductType {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  videos?: string[];
  reviewsEnabled?: boolean;
  category: string;
  stock: number;
  isFeatured: boolean;
  sizes: string[];
  colors: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface Review {
  _id: string;
  user: {
    name: string;
    image: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { formatPrice } = useCurrency();
  const { data: session } = useSession();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState<{
    type: "image" | "video";
    url: string;
  } | null>(null);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        // Fetch Product
        const res = await fetch(`/api/products?slug=${slug}`);
        if (!res.ok) {
          notFound();
          return;
        }
        const data = await res.json();
        setProduct(data);
        setActiveMedia({ type: "image", url: data.images[0] });

        // Fetch Reviews if enabled
        if (data.reviewsEnabled) {
          const reviewsRes = await fetch(`/api/reviews?productId=${data._id}`);
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [slug]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !product) return;

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product._id,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        const newReview = await res.json();
        // Optimistically update reviews
        setReviews([
          {
            ...newReview,
            user: {
              name: session.user?.name || "You",
              image: session.user?.image || "",
            },
          },
          ...reviews,
        ]);
        setComment("");
        setRating(5);
        alert("Review submitted successfully!");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review", error);
      alert("Something went wrong");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </main>
    );
  }

  if (!product) {
    notFound();
  }

  const averageRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(
        1
      )
    : "0.0";

  return (
    <main className={styles.container}>
      <div className={styles.grid}>
        {/* Media Gallery */}
        <div className={styles.mediaSection}>
          <div className={styles.mainMediaWrapper}>
            {activeMedia?.type === "video" ? (
              <video
                src={activeMedia.url}
                controls
                className={styles.mainVideo}
                autoPlay
              />
            ) : (
              <Image
                src={activeMedia?.url || "/placeholder.png"}
                alt={product.name}
                fill
                className={styles.mainImage}
                priority
              />
            )}
          </div>
          <div className={styles.thumbnailsGrid}>
            {product.images.map((image, index) => (
              <button
                key={`img-${index}`}
                onClick={() => setActiveMedia({ type: "image", url: image })}
                className={`${styles.thumbnailButton} ${
                  activeMedia?.url === image ? styles.thumbnailButtonActive : ""
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  className={styles.thumbnailImage}
                />
              </button>
            ))}
            {product.videos?.map((video, index) => (
              <button
                key={`vid-${index}`}
                onClick={() => setActiveMedia({ type: "video", url: video })}
                className={`${styles.thumbnailButton} ${
                  styles.videoThumbnail
                } ${
                  activeMedia?.url === video ? styles.thumbnailButtonActive : ""
                }`}
              >
                <span className={styles.videoLabel}>VIDEO</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className={styles.infoSection}>
          <div>
            <h1 className={styles.title}>{product.name}</h1>
            <div className={styles.meta}>
              <p className={styles.category}>{product.category}</p>
              {product.reviewsEnabled && (
                <div className={styles.ratingWrapper}>
                  <Star size={18} fill="#fbbf24" color="#fbbf24" />
                  <span className={styles.ratingValue}>{averageRating}</span>
                  <span className={styles.reviewCount}>
                    ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.price}>{formatPrice(product.price)}</div>

          <div className={styles.description}>
            <p>{product.description}</p>
          </div>

          <div className={styles.addToCartWrapper}>
            <AddToCart product={product} />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviewsEnabled && (
        <div className={styles.reviewsSection}>
          <h2 className={styles.reviewsTitle}>Customer Reviews</h2>

          <div className={styles.reviewsGrid}>
            {/* Review Form */}
            <div className={styles.reviewFormCard}>
              <h3 className={styles.formTitle}>Write a Review</h3>
              {session ? (
                <form onSubmit={handleSubmitReview}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Rating</label>
                    <div className={styles.starRatingInput}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={styles.starButton}
                        >
                          <Star
                            size={24}
                            fill={star <= rating ? "#fbbf24" : "none"}
                            color={star <= rating ? "#fbbf24" : "#d1d5db"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className={styles.textarea}
                      placeholder="Share your thoughts..."
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className={styles.submitButton}
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              ) : (
                <p className={styles.signInText}>
                  Please{" "}
                  <a href="/api/auth/signin" className={styles.signInLink}>
                    sign in
                  </a>{" "}
                  to write a review.
                </p>
              )}
            </div>

            {/* Reviews List */}
            <div className={styles.reviewsList}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                          {review.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className={styles.userName}>
                            {review.user?.name || "Anonymous"}
                          </div>
                          <div className={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className={styles.starDisplay}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < review.rating ? "#fbbf24" : "none"}
                            color={i < review.rating ? "#fbbf24" : "#e5e7eb"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className={styles.reviewComment}>{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className={styles.noReviews}>
                  No reviews yet. Be the first to review this product!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
