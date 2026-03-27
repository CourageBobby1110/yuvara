"use client";

import React, { memo } from "react";
import styles from "@/app/admin/products/ProductForm.module.css";

import { ShippingRate } from "@/lib/types";

interface ShippingRateItemProps {
  rate: ShippingRate;
  index: number;
  onUpdate: (updatedRate: ShippingRate) => void;
  onRemove: () => void;
}

const ShippingRateItem = memo(function ShippingRateItem({
  rate,
  index,
  onUpdate,
  onRemove,
}: ShippingRateItemProps) {
  const handleChange = (field: keyof ShippingRate, value: any) => {
    onUpdate({ ...rate, [field]: value });
  };

  return (
    <div className={styles.shippingRateItem}>
      <div className={styles.shippingRateItemHeader}>
        <span className={styles.rateTitle}>Rate #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className={styles.removeVariantButton}
          style={{ fontSize: "0.75rem" }}
        >
          Remove
        </button>
      </div>
      <div className={styles.shippingRateGrid}>
        <div>
          <label className={styles.shippingRateLabel}>Code</label>
          <input
            type="text"
            value={rate.countryCode}
            onChange={(e) => handleChange("countryCode", e.target.value.toUpperCase())}
            placeholder="NG"
            className={styles.shippingRateInput}
          />
        </div>
        <div>
          <label className={styles.shippingRateLabel}>Country</label>
          <input
            type="text"
            value={rate.countryName}
            onChange={(e) => handleChange("countryName", e.target.value)}
            placeholder="Nigeria"
            className={styles.shippingRateInput}
          />
        </div>
        <div>
          <label className={styles.shippingRateLabel}>Price ($)</label>
          <input
            type="number"
            value={rate.price}
            onChange={(e) => handleChange("price", parseFloat(e.target.value))}
            className={styles.shippingRateInput}
            step="0.01"
          />
        </div>
        <div>
          <label className={styles.shippingRateLabel}>Method</label>
          <input
            type="text"
            value={rate.method}
            onChange={(e) => handleChange("method", e.target.value)}
            placeholder="Method"
            className={styles.shippingRateInput}
          />
        </div>
        <div>
          <label className={styles.shippingRateLabel}>Time</label>
          <input
            type="text"
            value={rate.deliveryTime}
            onChange={(e) => handleChange("deliveryTime", e.target.value)}
            placeholder="Time"
            className={styles.shippingRateInput}
          />
        </div>
      </div>
    </div>
  );
});

export default ShippingRateItem;
