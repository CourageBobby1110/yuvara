"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Product } from "@/models/Product";
import { useCurrency } from "@/context/CurrencyContext";
import WishlistButton from "./WishlistButton";
import { Share2, Star, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const { data: session } = useSession();
  const { formatPrice } = useCurrency();

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let url = `${window.location.origin}/products/${product.slug}`;

    // Append referral code if user is logged in and has one
    if (session?.user?.referralCode) {
      url += `?ref=${session.user.referralCode}`;
    }

    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: product.description,
          url: url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(product);
    }
  };

  const isOutOfStock = !product.variants?.length && product.stock <= 0;

  return (
    <div className="group relative flex flex-col h-full bg-white p-3 rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0px_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-50">
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-lg mb-4"
      >
        <Image
          src={product.images[0] || "/placeholder.png"}
          alt={product.name}
          fill
          className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.isFeatured && (
            <span className="bg-black text-white text-[10px] uppercase tracking-wider px-2 py-1 font-medium">
              Featured
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-200 text-gray-600 text-[10px] uppercase tracking-wider px-2 py-1 font-medium">
              Sold Out
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <div className="bg-white/90 backdrop-blur-sm w-9 h-9 flex items-center justify-center rounded-full shadow-sm hover:bg-white transition-colors duration-200">
            <WishlistButton productId={product._id} />
          </div>
          <button
            onClick={handleQuickAddClick}
            disabled={isOutOfStock}
            className={`bg-white/90 backdrop-blur-sm w-9 h-9 flex items-center justify-center rounded-full shadow-sm hover:bg-white transition-colors duration-200 ${
              isOutOfStock
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-700 hover:text-black"
            }`}
            aria-label="Quick Add"
          >
            <ShoppingCart size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleShare}
            className="bg-white/90 backdrop-blur-sm w-9 h-9 flex items-center justify-center rounded-full shadow-sm hover:bg-white transition-colors duration-200 text-gray-700 hover:text-black"
            aria-label="Share product"
          >
            <Share2 size={18} strokeWidth={1.5} />
          </button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {product.category}
          </p>

          {/* Reviews */}
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-black text-black" />
            <span className="text-xs font-medium text-gray-700">
              {product.averageRating ? product.averageRating.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs text-gray-400">
              ({product.reviewCount || 0})
            </span>
          </div>
        </div>

        <Link
          href={`/products/${product.slug}`}
          className="group-hover:text-gray-600 transition-colors"
        >
          <h3 className="font-medium text-base text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-1 flex items-center justify-between">
          <p className="font-semibold text-gray-900">
            {formatPrice(product.price)}
          </p>
        </div>
      </div>
    </div>
  );
}
