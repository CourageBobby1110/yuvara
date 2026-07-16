"use client";

// Force rebuild

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import styles from "./CartDrawer.module.css";
import { useCurrency } from "@/context/CurrencyContext";
import { getItemShippingRateUSD } from "@/lib/utils";

export default function CartDrawer() {
  const { formatPrice, userCountryCode } = useCurrency();
  const { isOpen, closeCart, items, removeItem, updateQuantity, totalPrice } =
    useCartStore();

  // Handle hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTotal = totalPrice();

  // Compute shipping-merged subtotal for display
  const totalShippingUSD = userCountryCode
    ? items.reduce((sum, item) => {
        return sum + getItemShippingRateUSD(item, userCountryCode) * item.quantity;
      }, 0)
    : 0;
  const displayTotal = currentTotal + totalShippingUSD;

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
              <div
                key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                className={styles.item}
              >
                <div className={styles.itemImage}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="80px"
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
                    <p className="itemPrice">
                      {formatPrice(
                        (item.price + (userCountryCode ? getItemShippingRateUSD(item, userCountryCode) : 0))
                        * item.quantity
                      )}
                    </p>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.quantityControls}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1,
                            item.selectedSize,
                            item.selectedColor
                          )
                        }
                      >
                        -
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1,
                            item.selectedSize,
                            item.selectedColor
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() =>
                        removeItem(
                          item.id,
                          item.selectedSize,
                          item.selectedColor
                        )
                      }
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
              <span>{formatPrice(displayTotal)}</span>
            </div>
            {userCountryCode !== null && totalShippingUSD > 0 && (
              <p style={{
                fontSize: "0.7rem",
                color: "#16a34a",
                textAlign: "center",
                margin: "4px 0 0",
                fontWeight: 500,
              }}>
                ✓ Free shipping
              </p>
            )}
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
