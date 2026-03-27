"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import AdminLoader from "@/components/AdminLoader";
import { formatDistanceToNow } from "date-fns";
import styles from "../ProductForm.module.css";
import { useCurrency } from "@/context/CurrencyContext";
import CloudinaryVideoUpload from "@/components/CloudinaryVideoUpload";
import ProductVariantCard from "@/components/ProductVariantCard";
import { ShippingRate, ProductVariant as Variant } from "@/lib/types";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  slug: string;
  images: string[];
  videos?: string[];
  reviewsEnabled?: boolean;
  sizes?: string[];
  colors?: string[];
  variants?: {
    color: string;
    image: string;
    price: number;
    stock: number;
    size?: string;
    shippingFee?: number;
    shippingRates?: {
      countryCode: string;
      countryName: string;
      price: number;
      method?: string;
      deliveryTime?: string;
    }[];
  }[];
  productUrl?: string;
  shippingFee?: number;
  shippingRates?: {
    countryCode: string;
    countryName: string;
    price: number;
    method?: string;
    deliveryTime?: string;
  }[];
  lastSyncedPrice?: string;
  lastSyncedStock?: string;
  lastSyncedShipping?: string;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const [submitting, setSubmitting] = useState(false);
  const [syncingStock, setSyncingStock] = useState(false);
  const [syncingPrice, setSyncingPrice] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [syncingVariantId, setSyncingVariantId] = useState<string | null>(null);
  const [syncingStockVariantId, setSyncingStockVariantId] = useState<
    string | null
  >(null);
  const [syncingPriceVariantId, setSyncingPriceVariantId] = useState<
    string | null
  >(null);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [variants, setVariants] = useState<
    {
      color: string;
      image: string;
      price: string;
      stock: string;
      size?: string;
      shippingFee?: number;
      cjVid?: string;
      shippingRates?: {
        countryCode: string;
        countryName: string;
        price: number;
        method?: string;
        deliveryTime?: string;
      }[];
    }[]
  >([]);
  const [shippingRates, setShippingRates] = useState<
    {
      countryCode: string;
      countryName: string;
      price: string;
      method: string;
      deliveryTime: string;
    }[]
  >([]);
  const { currency, setCurrency, formatPrice, exchangeRates } = useCurrency();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    shippingFee: "0",
    slug: "",
    sizes: "",
    reviewsEnabled: true,

    productUrl: "",
    lastSyncedPrice: "",
    lastSyncedStock: "",
    lastSyncedShipping: "",
  });
  const [markupActive, setMarkupActive] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}?t=${Date.now()}`);
      if (res.ok) {
        const product: Product = await res.json();
        console.log("Fetched Product Data:", product); // DEBUG LOG
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          stock: product.stock.toString(),
          shippingFee: (product.shippingFee || 0).toString(),
          slug: product.slug,
          sizes: product.sizes?.join(", ") || "",
          reviewsEnabled: product.reviewsEnabled ?? true,
          productUrl: product.productUrl || "",
          lastSyncedPrice: product.lastSyncedPrice
            ? new Date(product.lastSyncedPrice).getTime().toString()
            : "",
          lastSyncedStock: product.lastSyncedStock
            ? new Date(product.lastSyncedStock).getTime().toString()
            : "",
          lastSyncedShipping: product.lastSyncedShipping
            ? new Date(product.lastSyncedShipping).getTime().toString()
            : "",
        });
        const repairUrl = (url: any) => {
          let str = String(url || "").trim();
          if (!str) return "";

          // Handle JSON stringified arrays or strings
          if (str.startsWith("[") || str.startsWith('"')) {
            // Try extracting URL with regex first
            const urlMatch = str.match(/https?:\/\/[^"'\s\]]+/);
            if (urlMatch) {
              str = urlMatch[0];
            } else {
              // Fallback: manually strip brackets and quotes
              str = str.replace(/[\[\]"']/g, "");
            }
          }

          str = str.replace(/^["']|["']$/g, "");

          if (str.startsWith("//")) return `https:${str}`;
          if (!str.startsWith("/") && !str.startsWith("http")) {
            return `https://${str}`;
          }
          return str;
        };

        setImages((product.images || []).map(repairUrl).filter(Boolean));
        setVideos(product.videos || []);
        setVariants(
          product.variants?.map((v) => ({
            color: v.color,
            image: repairUrl(v.image),
            price: v.price.toString(),
            stock: v.stock.toString(),
            size: v.size || "",
            shippingFee: v.shippingFee,
            cjVid: (v as any).cjVid, // Ensure we capture cjVid
            shippingRates: v.shippingRates,
          })) || [],
        );
        setShippingRates(
          product.shippingRates?.map((r) => ({
            countryCode: r.countryCode,
            countryName: r.countryName,
            price: r.price.toString(),
            method: r.method || "",
            deliveryTime: r.deliveryTime || "",
          })) || [],
        );
      } else {
        alert("Failed to fetch product");
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Error fetching product", error);
      alert("Something went wrong");
      router.push("/admin/products");
    } finally {
      setFetching(false);
    }
  };

  const syncPrice = async () => {
    if (
      !confirm(
        "This will update all variant prices from CJ (Cost * 1.5). Continue?",
      )
    )
      return;
    setSyncingPrice(true);
    try {
      const res = await fetch("/api/admin/dropshipping/sync-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Prices synced successfully!");
        fetchProduct(); // Refresh data
      } else {
        alert(data.error || "Failed to sync prices");
      }
    } catch (e) {
      alert("Error syncing prices");
    } finally {
      setSyncingPrice(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      const newState = { ...prev } as any;
      
      if (type === "checkbox") {
        newState[name] = (e.target as HTMLInputElement).checked;
      } else {
        newState[name] = value;
      }

      // Auto-generate slug from name if changed
      if (name === "name") {
        newState.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }

      return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const updateData: any = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        shippingFee: parseFloat(formData.shippingFee),
        images,
        videos,
        variants: variants.map((v) => ({
          ...v,
          price: parseFloat(v.price),
          stock: parseInt(v.stock),
        })),
        colors: Array.from(new Set(variants.map((v) => v.color))).filter(
          Boolean,
        ),
        shippingRates: shippingRates.map((r) => ({
          ...r,
          price: parseFloat(r.price),
        })),
      };

      // Parse sizes if provided
      if (formData.sizes) {
        updateData.sizes = formData.sizes
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product", error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCurrencyPreviews = (price: string) => {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum)) return null;

    return (
      <div className={styles.currencyPreviews}>
        <span>
          🇳🇬{" "}
          {new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
          }).format(priceNum * exchangeRates.NGN)}
        </span>
        <span>
          🇪🇺{" "}
          {new Intl.NumberFormat("en-IE", {
            style: "currency",
            currency: "EUR",
          }).format(priceNum * exchangeRates.EUR)}
        </span>
        <span>
          🇬🇧{" "}
          {new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: "GBP",
          }).format(priceNum * exchangeRates.GBP)}
        </span>
      </div>
    );
  };

  if (fetching) {
    return <AdminLoader />;
  }

  return (
    <div className={styles.container}>
      {/* Mobile Sticky Header */}
      {/* Mobile Header (Non-sticky, Column) */}
      <div className={styles.mobileHeader}>
        <h1 className={styles.mobileTitle}>Edit Product</h1>
        <div className={styles.mobileActions}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={styles.mobileSaveBtn}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.mobileCancelBtn}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Desktop Header (Hidden on Mobile) */}
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Product</h1>
        <div className={styles.controlsRow}>
          <div className={styles.syncGroup}>
            <button
              type="button"
              onClick={syncPrice}
              disabled={syncingPrice}
              className={styles.syncButton}
            >
              {syncingPrice ? "Syncing..." : "Sync Price (CJ)"}
            </button>
            {formData.lastSyncedPrice && !isNaN(Number(formData.lastSyncedPrice)) && (
              <span className={styles.syncTime}>
                {formatDistanceToNow(new Date(Number(formData.lastSyncedPrice)))} ago
              </span>
            )}
          </div>
          <div className={styles.currencyWrapper}>
            <button
              type="button"
              onClick={async () => {
                if (
                  !confirm(
                    "This will fetch the latest stock levels from CJ for all variants.",
                  )
                )
                  return;
                setSyncingStock(true);
                try {
                  const res = await fetch(
                    "/api/admin/dropshipping/sync-stock",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ productId: id }),
                    },
                  );
                  if (res.ok) {
                    alert("Stock synced successfully!");
                    fetchProduct(); // Reload data
                  } else {
                    const d = await res.json();
                    alert(d.error || "Failed to sync stock");
                  }
                } catch (e) {
                  alert("Error syncing stock");
                } finally {
                  setSyncingStock(false);
                }
              }}
              className={styles.syncButton}
              disabled={syncingStock}
            >
              {syncingStock ? "Syncing..." : "Sync Stock"}
            </button>
            {formData.lastSyncedStock && !isNaN(Number(formData.lastSyncedStock)) && (
              <span className={styles.syncTime}>
                {formatDistanceToNow(new Date(Number(formData.lastSyncedStock)))} ago
              </span>
            )}

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className={styles.currencySelect}
            >
              <option value="USD">USD ($)</option>
              <option value="NGN">NGN (₦)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div className={styles.desktopActions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.desktopCancelBtn}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={styles.desktopSaveBtn}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Mobile Actions Card (Sync Buttons) */}
        <div className={`${styles.card} ${styles.mobileQuickActionsCard}`}>
          <h4 className={styles.quickActionsTitle}>Quick Actions</h4>
          <div className={styles.quickActionsGrid}>
            <button
              type="button"
              onClick={syncPrice}
              disabled={syncingPrice}
              className={`${styles.syncButton} ${styles.mobileSyncButton}`}
            >
              {syncingPrice ? "Syncing..." : "Sync Price From CJ"}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (
                  !confirm(
                    "This will fetch the latest stock levels from CJ for all variants.",
                  )
                )
                  return;
                setSyncingStock(true);
                try {
                  const res = await fetch(
                    "/api/admin/dropshipping/sync-stock",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ productId: id }),
                    },
                  );
                  if (res.ok) {
                    alert("Stock synced successfully!");
                    fetchProduct(); // Reload data
                  } else {
                    const d = await res.json();
                    alert(d.error || "Failed to sync stock");
                  }
                } catch (e) {
                  alert("Error syncing stock");
                } finally {
                  setSyncingStock(false);
                }
              }}
              className={`${styles.syncButton} ${styles.mobileSyncButton}`}
              disabled={syncingStock}
            >
              {syncingStock ? "Syncing..." : "Sync Stock From CJ"}
            </button>
          </div>
        </div>

        {/* Basic Info Card */}
        <div className={styles.card}>
          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            <div style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
              <label className={styles.label}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className={styles.textarea}
              />
            </div>
            <div>
              <label className={styles.label}>Base Price ($)</label>
              <div className={styles.priceRow}>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={styles.input}
                />
                {/* 10% Markup Toggle */}
                <label className={styles.markupToggle}>
                  <input
                    type="checkbox"
                    checked={markupActive}
                    onChange={(e) => {
                      const isActive = e.target.checked;
                      setMarkupActive(isActive);

                      const multiplier = isActive ? 1.1 : 1 / 1.1;
                      const newPrice = (
                        parseFloat(formData.price || "0") * multiplier
                      ).toFixed(2);

                      setFormData((prev) => ({ ...prev, price: newPrice }));

                      // Also apply to all variants
                      const newVariants = variants.map((v) => ({
                        ...v,
                        price: (
                          parseFloat(v.price || "0") * multiplier
                        ).toFixed(2),
                      }));
                      setVariants(newVariants);
                    }}
                    className={styles.markupCheckbox}
                  />
                  <span className={styles.markupLabelText}>+10%</span>
                </label>
              </div>
              {formData.price && renderCurrencyPreviews(formData.price)}
            </div>
          </div>
        </div>

        {/* Stock & Category Card */}
        <div className={styles.card}>
          <div className={styles.grid2}>
            <div>
              <label className={styles.label}>Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                list="category-list"
                className={styles.input}
                placeholder="Select or type a category"
              />
              <datalist id="category-list">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={styles.label}>Shipping Fee ($)</label>
              <input
                type="number"
                name="shippingFee"
                value={formData.shippingFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Product URL (Optional)</label>
              <input
                type="url"
                name="productUrl"
                value={formData.productUrl}
                onChange={handleChange}
                className={`${styles.input} ${styles.productsUrlInput}`}
                placeholder="https://example.com/product"
              />
            </div>
          </div>
        </div>

        {/* Sizes Card */}
        <div className={styles.card}>
          <div>
            <label className={styles.label}>Sizes (comma separated)</label>
            <input
              type="text"
              name="sizes"
              value={formData.sizes}
              onChange={handleChange}
              placeholder="e.g. 7, 8, 9, 10"
              className={styles.input}
            />
          </div>
        </div>

        {/* Reviews Toggle Card */}
        <div className={styles.card}>
          <label
            className={styles.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              marginBottom: 0,
            }}
          >
            <input
              type="checkbox"
              name="reviewsEnabled"
              checked={formData.reviewsEnabled}
              onChange={handleChange}
              style={{ width: "1.25rem", height: "1.25rem" }}
            />
            Enable Reviews for this Product
          </label>
        </div>

        {/* Media Card */}
        <div className={styles.card}>
          <div>
            <label className={styles.label}>Images</label>
            <div className={styles.uploadContainer}>
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "yuvara_preset"}
                onSuccess={(result: any) => {
                  if (result.info?.secure_url) {
                    setImages((prev) => [...prev, result.info.secure_url]);
                    alert("Upload Completed");
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className={styles.uploadButton}
                  >
                    Upload Images
                  </button>
                )}
              </CldUploadWidget>
            </div>

            {images.length > 0 && (
              <div className={styles.imagesGrid}>
                {images.map((url, index) => (
                  <div key={index} className={styles.imageWrapper}>
                    <Image
                      src={url}
                      alt={`Product ${index + 1}`}
                      fill
                      className={styles.image}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages(images.filter((_, i) => i !== index))
                      }
                      className={styles.removeImageButton}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.videoSection}>
            <label className={styles.label}>Videos</label>
            <div className={styles.videoContainer}>
              <CloudinaryVideoUpload
                onUpload={(url: string) => {
                  setVideos((prev) => [...prev, url]);
                  alert("Video added!");
                }}
              />
            </div>

            {videos.length > 0 && (
              <div className={styles.imagesGrid}>
                {videos.map((url, index) => (
                  <div key={index} className={styles.imageWrapper}>
                    <video src={url} className={styles.image} controls />
                    <button
                      type="button"
                      onClick={() =>
                        setVideos(videos.filter((_, i) => i !== index))
                      }
                      className={styles.removeImageButton}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Variants Section */}
        <div className={styles.variantsSection}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>Product Variants</label>
            <button
              type="button"
              onClick={() =>
                setVariants([
                  ...variants,
                  {
                    color: "",
                    price: formData.price,
                    stock: formData.stock,
                    image: "",
                    size: "",
                  },
                ])
              }
              className={styles.addVariantButton}
            >
              + Add Variant
            </button>
          </div>

          {variants.map((variant, index) => (
            <ProductVariantCard
              key={index}
              variant={variant as any}
              index={index}
              onUpdate={(idx, updated) => {
                const newVariants = [...variants];
                newVariants[idx] = updated;
                setVariants(newVariants);
              }}
              onRemove={(idx) => {
                setVariants(variants.filter((_, i) => i !== idx));
              }}
              onSyncShipping={async (idx) => {
                const v = variants[idx];
                if (!v.cjVid) return;
                setSyncingVariantId(v.cjVid);
                try {
                  const res = await fetch("/api/admin/dropshipping/sync-shipping", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: id, targetVid: v.cjVid }),
                  });
                  if (res.ok) {
                    alert("Shipping synced!");
                    fetchProduct();
                  }
                } finally {
                  setSyncingVariantId(null);
                }
              }}
              onSyncStock={async (idx) => {
                const v = variants[idx];
                if (!v.cjVid) return;
                setSyncingStockVariantId(v.cjVid);
                try {
                  const res = await fetch("/api/admin/dropshipping/sync-stock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: id, targetVid: v.cjVid }),
                  });
                  if (res.ok) {
                    alert("Stock synced!");
                    fetchProduct();
                  }
                } finally {
                  setSyncingStockVariantId(null);
                }
              }}
              onSyncPrice={async (idx) => {
                const v = variants[idx];
                if (!v.cjVid) return;
                setSyncingPriceVariantId(v.cjVid);
                try {
                  const res = await fetch("/api/admin/dropshipping/sync-price", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId: id, targetVid: v.cjVid }),
                  });
                  if (res.ok) {
                    alert("Price synced!");
                    fetchProduct();
                  }
                } finally {
                  setSyncingPriceVariantId(null);
                }
              }}
              syncingShipping={syncingVariantId === variant.cjVid}
              syncingStock={syncingStockVariantId === variant.cjVid}
              syncingPrice={syncingPriceVariantId === variant.cjVid}
              renderCurrencyPreviews={renderCurrencyPreviews}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={styles.submitButton}
        >
          {submitting ? "Saving..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}
