"use client";

import { useState, useEffect } from "react";
import AddToCart from "@/components/AddToCart";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { Star } from "lucide-react";
import { useSession } from "next-auth/react";

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
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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
    <main className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Media Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
            {activeMedia?.type === "video" ? (
              <video
                src={activeMedia.url}
                controls
                className="w-full h-full object-cover"
                autoPlay
              />
            ) : (
              <Image
                src={activeMedia?.url || "/placeholder.png"}
                alt={product.name}
                fill
                className="object-cover object-center"
                priority
              />
            )}
          </div>
          <div className="grid grid-cols-5 gap-4">
            {product.images.map((image, index) => (
              <button
                key={`img-${index}`}
                onClick={() => setActiveMedia({ type: "image", url: image })}
                className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 border-2 transition-all ${
                  activeMedia?.url === image
                    ? "border-black"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  className="object-cover object-center"
                />
              </button>
            ))}
            {product.videos?.map((video, index) => (
              <button
                key={`vid-${index}`}
                onClick={() => setActiveMedia({ type: "video", url: video })}
                className={`relative aspect-square overflow-hidden rounded-lg bg-gray-900 border-2 transition-all flex items-center justify-center ${
                  activeMedia?.url === video
                    ? "border-black"
                    : "border-transparent"
                }`}
              >
                <span className="text-white text-xs font-bold">VIDEO</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-lg text-gray-500 font-medium">
                {product.category}
              </p>
              {product.reviewsEnabled && (
                <div className="flex items-center gap-1">
                  <Star size={18} fill="#fbbf24" color="#fbbf24" />
                  <span className="font-bold text-gray-900">
                    {averageRating}
                  </span>
                  <span className="text-gray-500">
                    ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </div>

          <div className="prose prose-lg text-gray-600 leading-relaxed">
            <p>{product.description}</p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <AddToCart product={product} />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {product.reviewsEnabled && (
        <div className="border-t border-gray-200 pt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Customer Reviews
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Review Form */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Write a Review
                </h3>
                {session ? (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comment
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-black focus:ring-black"
                        placeholder="Share your thoughts..."
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-900 transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </form>
                ) : (
                  <p className="text-gray-600">
                    Please{" "}
                    <a
                      href="/api/auth/signin"
                      className="text-black font-bold underline"
                    >
                      sign in
                    </a>{" "}
                    to write a review.
                  </p>
                )}
              </div>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review._id}
                    className="border-b border-gray-100 pb-6 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                          {review.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {review.user?.name || "Anonymous"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
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
                    <p className="text-gray-600 leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl">
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
