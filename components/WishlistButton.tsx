"use client";

import { useWishlistStore } from "@/store/wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({
  productId,
  className,
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const isAdded = isInWishlist(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 z-10 shadow-sm",
        className
      )}
      aria-label={isAdded ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        className={cn(
          "w-5 h-5 transition-colors duration-300",
          isAdded
            ? "fill-red-500 text-red-500"
            : "fill-none text-gray-600 hover:text-red-500"
        )}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
