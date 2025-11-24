"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/models/Product";
import styles from "./QuickAddModal.module.css";

interface QuickAddModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddModal({ product, isOpen, onClose }: QuickAddModalProps) {
  const { addItem, openCart } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
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
    }
  }, [product]);

  if (!isVisible && !isOpen) return null;
  if (!product) return null;

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert("Please select a size");
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert("Please select a color");
      return;
    }

    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "/placeholder.png",
      slug: product.slug,
      selectedSize,
      selectedColor,
    });

    onClose();
    openCart();
  };

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
              src={product.images[0] || "/placeholder.png"}
              alt={product.name}
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className={styles.details}>
            <h3 className={styles.name}>{product.name}</h3>
            <p className={styles.price}>${product.price.toFixed(2)}</p>
          </div>
        </div>

        {product.sizes && product.sizes.length > 0 && (
          <div className={styles.section}>
            <label className={styles.label}>Select Size</label>
            <div className={styles.options}>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`${styles.optionBtn} ${selectedSize === size ? styles.selected : ""}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.colors && product.colors.length > 0 && (
          <div className={styles.section}>
            <label className={styles.label}>Select Color</label>
            <div className={styles.options}>
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`${styles.optionBtn} ${selectedColor === color ? styles.selected : ""}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={handleAddToCart}
          className={styles.addToCartBtn}
          disabled={
            (product.sizes && product.sizes.length > 0 && !selectedSize) ||
            (product.colors && product.colors.length > 0 && !selectedColor)
          }
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
