"use client";

import React, { memo } from "react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import styles from "@/app/admin/products/ProductForm.module.css";
import ShippingRateItem from "@/components/ShippingRateItem";

import { ShippingRate, ProductVariant as Variant } from "@/lib/types";

interface ProductVariantCardProps {
  variant: Variant;
  index: number;
  onUpdate: (index: number, updatedVariant: Variant) => void;
  onRemove: (index: number) => void;
  onSyncShipping: (index: number) => Promise<void>;
  onSyncStock: (index: number) => Promise<void>;
  onSyncPrice: (index: number) => Promise<void>;
  syncingShipping: boolean;
  syncingStock: boolean;
  syncingPrice: boolean;
  renderCurrencyPreviews: (price: string) => React.ReactNode;
}

const ProductVariantCard = memo(function ProductVariantCard({
  variant,
  index,
  onUpdate,
  onRemove,
  onSyncShipping,
  onSyncStock,
  onSyncPrice,
  syncingShipping,
  syncingStock,
  syncingPrice,
  renderCurrencyPreviews,
}: ProductVariantCardProps) {
  const updateField = (field: keyof Variant, value: any) => {
    onUpdate(index, { ...variant, [field]: value });
  };

  const updateShippingRate = (rIndex: number, updatedRate: ShippingRate) => {
    const newRates = [...(variant.shippingRates || [])];
    newRates[rIndex] = updatedRate;
    updateField("shippingRates", newRates);
  };

  const removeShippingRate = (rIndex: number) => {
    const newRates = (variant.shippingRates || []).filter((_, i) => i !== rIndex);
    updateField("shippingRates", newRates);
  };

  const addShippingRate = () => {
    const newRates = [
      ...(variant.shippingRates || []),
      { countryCode: "", countryName: "", price: 0, method: "", deliveryTime: "" },
    ];
    updateField("shippingRates", newRates);
  };

  return (
    <div className={styles.variantCard}>
      <div className={styles.variantCardHeader}>
        <h4 className="font-medium">Variant {index + 1}</h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className={styles.removeVariantButton}
        >
          Remove
        </button>
      </div>

      <div className={styles.grid2}>
        <div>
          <label className={styles.label}>Color Name</label>
          <input
            type="text"
            value={variant.color}
            onChange={(e) => updateField("color", e.target.value)}
            placeholder="e.g. Red"
            className={styles.input}
            required
          />
        </div>
        <div>
          <label className={styles.label}>Size (Optional)</label>
          <input
            type="text"
            value={variant.size || ""}
            onChange={(e) => updateField("size", e.target.value)}
            placeholder="e.g. XL"
            className={styles.input}
          />
        </div>
        <div>
          <label className={styles.label}>Price Override</label>
          <input
            type="number"
            value={variant.price}
            onChange={(e) => updateField("price", e.target.value)}
            className={styles.input}
            required
            step="0.01"
          />
          {renderCurrencyPreviews(variant.price)}
        </div>
        <div>
          <label className={styles.label}>Stock</label>
          <input
            type="number"
            value={variant.stock}
            onChange={(e) => updateField("stock", e.target.value)}
            className={styles.input}
            required
          />
        </div>
        <div>
          <label className={styles.label}>Shipping Fee ($)</label>
          <input
            type="number"
            value={variant.shippingFee || 0}
            onChange={(e) => updateField("shippingFee", parseFloat(e.target.value))}
            className={styles.input}
            min="0"
            step="0.01"
          />
          {variant.cjVid && (
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => onSyncShipping(index)}
                disabled={syncingShipping}
                className={styles.syncButton}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              >
                {syncingShipping ? "Syncing..." : "Sync Shipping"}
              </button>
              <button
                type="button"
                onClick={() => onSyncStock(index)}
                disabled={syncingStock}
                className={styles.syncButton}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              >
                {syncingStock ? "Syncing..." : "Sync Stock"}
              </button>
              <button
                type="button"
                onClick={() => onSyncPrice(index)}
                disabled={syncingPrice}
                className={styles.syncButton}
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              >
                {syncingPrice ? "Syncing..." : "Sync Price (CJ)"}
              </button>
            </div>
          )}
        </div>
        <div>
          <label className={styles.label}>Variant Image</label>
          {variant.image ? (
            <div className={styles.imageWrapper} style={{ width: "80px", height: "80px" }}>
              <Image src={variant.image} alt="Variant" fill className={styles.image} />
              <button
                type="button"
                onClick={() => updateField("image", "")}
                className={styles.removeImageButton}
              >
                X
              </button>
            </div>
          ) : (
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "yuvara_preset"}
              onSuccess={(result: any) => {
                if (result.info?.secure_url) {
                  updateField("image", result.info.secure_url);
                }
              }}
            >
              {({ open }) => (
                <button type="button" onClick={() => open()} className={styles.uploadButtonSmall}>
                  Upload
                </button>
              )}
            </CldUploadWidget>
          )}
        </div>
      </div>

      <div className={styles.shippingRatesContainer}>
        <div className={styles.shippingRateHeader}>
          <h5 className={styles.shippingRateTitle}>Shipping Rates</h5>
          <button
            type="button"
            onClick={addShippingRate}
            className={styles.addVariantButton}
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
          >
            + Add Rate
          </button>
        </div>

        {(variant.shippingRates || []).map((rate, rIndex) => (
          <ShippingRateItem
            key={rIndex}
            rate={rate}
            index={rIndex}
            onUpdate={(updatedRate: ShippingRate) => updateShippingRate(rIndex, updatedRate)}
            onRemove={() => removeShippingRate(rIndex)}
          />
        ))}
      </div>
    </div>
  );
});

export default ProductVariantCard;
