"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/models/Product";

import { useCurrency } from "@/context/CurrencyContext";

interface AddToCartProps {
  product: Product;
  selectedVariant?: {
    color: string;
    image: string;
    price: number;
    stock: number;
    size?: string;
    cjVid?: string;
    shippingFee?: number;
    shippingRates?: {
      countryCode: string;
      countryName: string;
      price: number;
      method?: string;
      deliveryTime?: string;
    }[];
  } | null;
}

export default function AddToCart({
  product,
  selectedVariant,
}: AddToCartProps) {
  const { addItem, openCart } = useCartStore();
  const { formatPrice } = useCurrency();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  const availableSizes =
    product.sizes?.filter((s) => s && s.trim() !== "") || [];

  const isOutOfStock = selectedVariant
    ? selectedVariant.stock <= 0
    : product.stock <= 0;

  const handleAddToCart = () => {
    // Size validation (Legacy) - Only check if NO variant is selected
    if (!selectedVariant && availableSizes.length > 0 && !selectedSize) {
      alert("Please select a size");
      return;
    }

    // Variant/Color validation
    if (product.variants && product.variants.length > 0) {
      if (!selectedVariant) {
        alert("Please select a variant");
        return;
      }
      // Check if variant has size but none selected (though UI enforces this usually)
      if (selectedVariant.size && !selectedVariant.size) {
        // This case is handled by the selection logic in parent,
        // but we can double check if needed.
        // Actually, selectedVariant IS the specific combination now.
      }
    } else if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Please select a color");
      return;
    }

    const priceToUse = selectedVariant ? selectedVariant.price : product.price;
    const imageToUse = selectedVariant
      ? selectedVariant.image
      : product.images[0] || "/placeholder.png";
    const colorToUse = selectedVariant ? selectedVariant.color : selectedColor;
    const sizeToUse = selectedVariant ? selectedVariant.size : selectedSize;

    // Map Product to CartItem format
    addItem({
      id: product._id,
      name: product.name,
      price: priceToUse,
      image: imageToUse,
      slug: product.slug,
      selectedSize: sizeToUse,
      selectedColor: colorToUse,
      cjVid: selectedVariant?.cjVid,
      shippingRates: product.shippingRates,
      variant: selectedVariant
        ? {
            shippingFee: selectedVariant.shippingFee,
            shippingRates: selectedVariant.shippingRates,
          }
        : undefined,
    });

    // Klaviyo "Added to Cart" tracking
    const klaviyo = (window as any).klaviyo || [];
    if (klaviyo) {
      klaviyo.push([
        "track",
        "Added to Cart",
        {
          Title: product.name,
          ItemId: product._id,
          Categories: product.category,
          ImageUrl: imageToUse,
          Url: window.location.href,
          Metadata: {
            Price: priceToUse,
            Variant: colorToUse,
            Size: sizeToUse,
          },
        },
      ]);
    }

    // Open the cart drawer to show the added item
    openCart();
  };

  return (
    <div className="flex flex-col gap-4">
      {availableSizes.length > 0 &&
        (!product.variants || product.variants.length === 0) && (
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="flex gap-2 flex-wrap">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded-md ${
                    selectedSize === size
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Only show color selector if NO variants exist (legacy support) */}
      {(!product.variants || product.variants.length === 0) &&
        product.colors &&
        product.colors.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 border rounded-md ${
                    selectedColor === color
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300 hover:border-black"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`w-full py-3 px-6 rounded-md font-semibold transition-colors mt-4 ${
          isOutOfStock
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800"
        }`}
      >
        {isOutOfStock
          ? "Out of Stock"
          : `Add to Cart - ${formatPrice(
              selectedVariant ? selectedVariant.price : product.price
            )}`}
      </button>
    </div>
  );
}
