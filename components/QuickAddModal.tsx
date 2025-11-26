"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/models/Product";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./QuickAddModal.module.css";

interface QuickAddModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddModal({
  product,
  isOpen,
  onClose,
}: QuickAddModalProps) {
  const { addItem, openCart } = useCartStore();
  const { formatPrice } = useCurrency();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<{
    color: string;
    image: string;
    price: number;
    stock: number;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation visibility
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset selection when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize("");
      setSelectedColor("");
      setSelectedVariant(null);
    }
  }, [product]);

  if (!isVisible && !isOpen) return null;
  if (!product) return null;

  const availableSizes =
    product.sizes?.filter((s) => s && s.trim() !== "") || [];

  const handleAddToCart = () => {
    // Size is only required if the product has sizes
    if (availableSizes.length > 0 && !selectedSize) {
      alert("Please select a size");
      return;
    }

    // Color/Variant validation
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert("Please select a variant");
      return;
    } else if (
      (!product.variants || product.variants.length === 0) &&
      product.colors &&
      product.colors.length > 0 &&
      !selectedColor
    ) {
      alert("Please select a color");
      return;
    }

    const priceToUse = selectedVariant ? selectedVariant.price : product.price;
    const imageToUse = selectedVariant
      ? selectedVariant.image
      : product.images[0] || "/placeholder.png";
    const colorToUse = selectedVariant ? selectedVariant.color : selectedColor;

    addItem({
      id: product._id,
      name: product.name,
      price: priceToUse,
      image: imageToUse,
      slug: product.slug,
      selectedSize,
      selectedColor: colorToUse,
    });

    onClose();
    openCart();
  };

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentImage = selectedVariant
    ? selectedVariant.image
    : product.images[0] || "/placeholder.png";

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.open : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.closeButton}>
          &times;
        </button>

        <div className={styles.productInfo}>
          <div className={styles.imageWrapper}>
            <Image
              src={currentImage}
              alt={product.name}
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className={styles.details}>
            <h3 className={styles.name}>{product.name}</h3>
            <p className={styles.price}>{formatPrice(currentPrice)}</p>
          </div>
        </div>

        {availableSizes.length > 0 && (
          <div className={styles.section}>
            <label className={styles.label}>Select Size</label>
            <div className={styles.options}>
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`${styles.optionBtn} ${
                    selectedSize === size ? styles.selected : ""
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Variant Selection (if variants exist) */}
        {product.variants && product.variants.length > 0 ? (
          <div className={styles.section}>
            <label className={styles.label}>
              Select Color:{" "}
              <span style={{ fontWeight: 400 }}>
                {selectedVariant?.color || "None"}
              </span>
            </label>
            <div className={styles.variantGrid}>
              {product.variants.map((variant, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedVariant(variant)}
                  className={`${styles.variantButton} ${
                    selectedVariant === variant ? styles.activeVariant : ""
                  }`}
                  title={variant.color}
                >
                  <Image
                    src={variant.image}
                    alt={variant.color}
                    width={40}
                    height={40}
                    className={styles.variantImage}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Fallback to simple color selection if no variants but colors exist */
          product.colors &&
          product.colors.length > 0 && (
            <div className={styles.section}>
              <label className={styles.label}>Select Color</label>
              <div className={styles.options}>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`${styles.optionBtn} ${
                      selectedColor === color ? styles.selected : ""
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )
        )}

        <button
          onClick={handleAddToCart}
          className={`${styles.addToCartBtn} ${
            (selectedVariant && selectedVariant.stock <= 0) ||
            (!selectedVariant && product.stock <= 0)
              ? styles.disabled
              : ""
          }`}
          disabled={
            (availableSizes.length > 0 && !selectedSize) ||
            (product.variants &&
              product.variants.length > 0 &&
              !selectedVariant) ||
            ((!product.variants || product.variants.length === 0) &&
              product.colors &&
              product.colors.length > 0 &&
              !selectedColor) ||
            (selectedVariant && selectedVariant.stock <= 0) ||
            (!selectedVariant && !product.variants && product.stock <= 0)
          }
        >
          {(selectedVariant && selectedVariant.stock <= 0) ||
          (!selectedVariant && !product.variants && product.stock <= 0)
            ? "Out of Stock"
            : `Add to Cart - ${formatPrice(currentPrice)}`}
        </button>
      </div>
    </div>
  );
}
