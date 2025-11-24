"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import styles from "./CartDrawer.module.css";
import { useCurrency } from "@/context/CurrencyContext";

export default function CartDrawer() {
  const { formatPrice } = useCurrency();
  const { 
    isOpen, 
    closeCart, 
    items, 
    removeItem, 
    updateQuantity, 
    totalPrice,
    freeShippingThreshold
  } = useCartStore();
  
  // Handle hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    useCartStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTotal = totalPrice();
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentTotal);
  const progressPercentage = Math.min(100, (currentTotal / freeShippingThreshold) * 100);

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.open : ""}`} 
        onClick={closeCart}
      />
      
      <div className={`${styles.drawer} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Shopping Cart ({items.length})</h2>
          <button onClick={closeCart} className={styles.closeButton}>
            &times;
          </button>
        </div>

        {items.length > 0 && (
          <div className={styles.progressContainer}>
            <p className={styles.progressText}>
              {remainingForFreeShipping > 0 
                ? `Add ${formatPrice(remainingForFreeShipping)} more for Free Shipping` 
                : "You've unlocked Free Shipping!"}
            </p>
            <div className={styles.progressBarBg}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        <div className={styles.items}>
          {items.length === 0 ? (
            <div className={styles.emptyCart}>
              <p>Your cart is currently empty.</p>
              <button onClick={closeCart} className={styles.continueButton}>
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className={styles.item}>
                <div className={styles.itemImage}>
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    fill 
                    style={{ objectFit: "cover" }} 
                  />
                </div>
                <div className={styles.itemDetails}>
                  <div>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    {(item.selectedSize || item.selectedColor) && (
                      <p className={styles.itemVariant}>
                        {item.selectedSize && `Size: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && " | "}
                        {item.selectedColor && `Color: ${item.selectedColor}`}
                      </p>
                    )}
                    <p className="itemPrice">{formatPrice(item.price)}</p>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.quantityControls}>
                      <button 
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize, item.selectedColor)}
                      >
                        -
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button 
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.total}>
              <span>Subtotal</span>
              <span>{formatPrice(currentTotal)}</span>
            </div>
            <Link 
              href="/checkout" 
              className={styles.checkoutButton}
              onClick={closeCart}
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
