"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import AdminLoader from "@/components/AdminLoader";
import { formatDistanceToNow } from "date-fns";
import styles from "../ProductForm.module.css";
import { useCurrency } from "@/context/CurrencyContext";
import CloudinaryVideoUpload from "@/components/CloudinaryVideoUpload";

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
            ? new Date(product.lastSyncedPrice).toISOString()
            : "",
          lastSyncedStock: product.lastSyncedStock
            ? new Date(product.lastSyncedStock).toISOString()
            : "",
          lastSyncedShipping: product.lastSyncedShipping
            ? new Date(product.lastSyncedShipping).toISOString()
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

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Auto-generate slug from name
    if (name === "name") {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
      }));
    }
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
      <div className="text-xs text-gray-500 mt-1 flex gap-2 flex-wrap">
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
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Product</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={syncPrice}
            disabled={syncingPrice}
            className={styles.syncButton}
          >
            {syncingPrice ? "Syncing..." : "Sync Price (CJ)"}
          </button>
          {formData.lastSyncedPrice && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(formData.lastSyncedPrice))} ago
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
                const res = await fetch("/api/admin/dropshipping/sync-stock", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ productId: id }),
                });
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
          {formData.lastSyncedStock && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(formData.lastSyncedStock))} ago
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
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
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
          <div>
            <label className={styles.label}>Base Price ($)</label>
            <div className="flex gap-2">
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
              <label
                className="flex items-center gap-2 cursor-pointer bg-gray-100 px-2 rounded border border-gray-300"
                style={{
                  height: "42px",
                  backgroundColor: "var(--color-bg-secondary)",
                  borderColor: "var(--color-border-medium)",
                }}
              >
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
                      price: (parseFloat(v.price || "0") * multiplier).toFixed(
                        2,
                      ),
                    }));
                    setVariants(newVariants);
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium whitespace-nowrap">
                  10% Markup
                </span>
              </label>
            </div>
            {formData.price && renderCurrencyPreviews(formData.price)}
          </div>
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

        <div className={styles.grid2}>
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

        <div style={{ marginBottom: "2rem" }}>
          <label
            className={styles.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
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

        <div>
          <label className={styles.label}>Images</label>
          <div className={styles.uploadContainer}>
            <UploadDropzone
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                if (res) {
                  setImages((prev) => [
                    ...prev,
                    ...res.map((file) => file.url),
                  ]);
                  alert("Upload Completed");
                }
              }}
              onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
              }}
              appearance={{
                button: { background: "var(--color-primary)", color: "white" },
                allowedContent: { color: "var(--color-text-secondary)" },
              }}
            />
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

        <div style={{ marginTop: "2rem" }}>
          <label className={styles.label}>Videos</label>
          <div className="mb-4">
            <CloudinaryVideoUpload
              onUpload={(url) => {
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

        <div className={styles.variantsSection}>
          <div className="flex justify-between items-center mb-4">
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
            <div key={index} className={styles.variantCard}>
              <div className="flex justify-between mb-2">
                <h4 className="font-medium">Variant {index + 1}</h4>
                <button
                  type="button"
                  onClick={() =>
                    setVariants(variants.filter((_, i) => i !== index))
                  }
                  style={{
                    color: "#ef4444",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
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
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].color = e.target.value;
                      setVariants(newVariants);
                    }}
                    placeholder="e.g. Red"
                    className={styles.input}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label}>Size (Optional)</label>
                  <input
                    type="text"
                    value={(variant as any).size || ""}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      (newVariants[index] as any).size = e.target.value;
                      setVariants(newVariants);
                    }}
                    placeholder="e.g. XL"
                    className={styles.input}
                  />
                </div>
                <div>
                  <label className={styles.label}>Price Override</label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].price = e.target.value;
                      setVariants(newVariants);
                    }}
                    className={styles.input}
                    required
                  />
                  {renderCurrencyPreviews(variant.price)}
                </div>
                <div>
                  <label className={styles.label}>Stock</label>
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].stock = e.target.value;
                      setVariants(newVariants);
                    }}
                    className={styles.input}
                    required
                  />
                </div>
                <div>
                  <label className={styles.label}>Shipping Fee ($)</label>
                  <input
                    type="number"
                    value={variant.shippingFee || 0}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].shippingFee = parseFloat(
                        e.target.value,
                      );
                      setVariants(newVariants);
                    }}
                    className={styles.input}
                    min="0"
                    step="0.01"
                  />
                  {variant.cjVid && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <button
                        type="button"
                        onClick={async () => {
                          setSyncingVariantId(variant.cjVid!);
                          try {
                            const res = await fetch(
                              "/api/admin/dropshipping/sync-shipping",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  productId: id,
                                  targetVid: variant.cjVid,
                                }),
                              },
                            );
                            if (res.ok) {
                              alert("Shipping synced for this variant!");
                              fetchProduct();
                            } else {
                              const d = await res.json();
                              alert(
                                d.error || "Failed to sync variant shipping",
                              );
                            }
                          } catch (e) {
                            alert("Error syncing variant shipping");
                          } finally {
                            setSyncingVariantId(null);
                          }
                        }}
                        disabled={syncingVariantId === variant.cjVid}
                        className={styles.syncButton}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                        }}
                      >
                        {syncingVariantId === variant.cjVid
                          ? "Syncing..."
                          : "Sync Shipping"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setSyncingStockVariantId(variant.cjVid!);
                          try {
                            const res = await fetch(
                              "/api/admin/dropshipping/sync-stock",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  productId: id,
                                  targetVid: variant.cjVid,
                                }),
                              },
                            );
                            if (res.ok) {
                              alert("Stock synced for this variant!");
                              fetchProduct();
                            } else {
                              const d = await res.json();
                              alert(d.error || "Failed to sync variant stock");
                            }
                          } catch (e) {
                            alert("Error syncing variant stock");
                          } finally {
                            setSyncingStockVariantId(null);
                          }
                        }}
                        disabled={syncingStockVariantId === variant.cjVid}
                        className={styles.syncButton}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                        }}
                      >
                        {syncingStockVariantId === variant.cjVid
                          ? "Syncing..."
                          : "Sync Stock"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setSyncingPriceVariantId(variant.cjVid!);
                          try {
                            const res = await fetch(
                              "/api/admin/dropshipping/sync-price",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  productId: id,
                                  targetVid: variant.cjVid,
                                }),
                              },
                            );
                            if (res.ok) {
                              alert("Price synced for this variant!");
                              fetchProduct();
                            } else {
                              const d = await res.json();
                              alert(d.error || "Failed to sync variant price");
                            }
                          } catch (e) {
                            alert("Error syncing variant price");
                          } finally {
                            setSyncingPriceVariantId(null);
                          }
                        }}
                        disabled={syncingPriceVariantId === variant.cjVid}
                        className={styles.syncButton}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                        }}
                      >
                        {syncingPriceVariantId === variant.cjVid
                          ? "Syncing..."
                          : "Sync Price (CJ)"}
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className={styles.label}>Variant Image</label>
                  {variant.image ? (
                    <div
                      className={styles.imageWrapper}
                      style={{ width: "80px", height: "80px" }}
                    >
                      <Image
                        src={variant.image}
                        alt="Variant"
                        fill
                        className={styles.image}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = [...variants];
                          newVariants[index].image = "";
                          setVariants(newVariants);
                        }}
                        className={styles.removeImageButton}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <UploadDropzone
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                          const newVariants = [...variants];
                          newVariants[index].image = res[0].url;
                          setVariants(newVariants);
                          // Also add to main images if not present
                          if (!images.includes(res[0].url)) {
                            setImages((prev) => [...prev, res[0].url]);
                          }
                        }
                      }}
                      onUploadError={(error: Error) => {
                        alert(`ERROR! ${error.message}`);
                      }}
                      appearance={{
                        button: {
                          padding: "0.25rem 0.5rem",
                          fontSize: "0.75rem",
                          background: "var(--color-primary)",
                        },
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Variant Shipping Rates Management */}
              <div className={styles.shippingRatesContainer}>
                <div className={styles.shippingRateHeader}>
                  <h5 className={styles.shippingRateTitle}>Shipping Rates</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const newVariants = [...variants];
                      const currentRates =
                        newVariants[index].shippingRates || [];
                      newVariants[index].shippingRates = [
                        ...currentRates,
                        {
                          countryCode: "",
                          countryName: "",
                          price: 0,
                          method: "",
                          deliveryTime: "",
                        },
                      ];
                      setVariants(newVariants);
                    }}
                    className={styles.addVariantButton}
                    style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
                  >
                    + Add Rate
                  </button>
                </div>

                {(variant.shippingRates || []).map((rate, rIndex) => (
                  <div key={rIndex} className={styles.shippingRateItem}>
                    <div className={styles.shippingRateItemHeader}>
                      <span
                        className="font-bold text-gray-700"
                        style={{ fontSize: "0.8rem" }}
                      >
                        Rate #{rIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = [...variants];
                          newVariants[index].shippingRates = (
                            newVariants[index].shippingRates || []
                          ).filter((_, i) => i !== rIndex);
                          setVariants(newVariants);
                        }}
                        style={{
                          color: "#ef4444",
                          fontSize: "0.75rem",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
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
                          onChange={(e) => {
                            const newVariants = [...variants];
                            if (!newVariants[index].shippingRates) return;
                            newVariants[index].shippingRates![
                              rIndex
                            ].countryCode = e.target.value.toUpperCase();
                            setVariants(newVariants);
                          }}
                          placeholder="NG"
                          className={styles.shippingRateInput}
                        />
                      </div>
                      <div>
                        <label className={styles.shippingRateLabel}>
                          Country
                        </label>
                        <input
                          type="text"
                          value={rate.countryName}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            if (!newVariants[index].shippingRates) return;
                            newVariants[index].shippingRates![
                              rIndex
                            ].countryName = e.target.value;
                            setVariants(newVariants);
                          }}
                          placeholder="Nigeria"
                          className={styles.shippingRateInput}
                        />
                      </div>
                      <div>
                        <label className={styles.shippingRateLabel}>
                          Price ($)
                        </label>
                        <input
                          type="number"
                          value={rate.price}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            if (!newVariants[index].shippingRates) return;
                            newVariants[index].shippingRates![rIndex].price =
                              parseFloat(e.target.value);
                            setVariants(newVariants);
                          }}
                          className={styles.shippingRateInput}
                        />
                      </div>
                      <div>
                        <label className={styles.shippingRateLabel}>
                          Method
                        </label>
                        <input
                          type="text"
                          value={rate.method}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            if (!newVariants[index].shippingRates) return;
                            newVariants[index].shippingRates![rIndex].method =
                              e.target.value;
                            setVariants(newVariants);
                          }}
                          placeholder="Method"
                          className={styles.shippingRateInput}
                        />
                      </div>
                      <div>
                        <label className={styles.shippingRateLabel}>Time</label>
                        <input
                          type="text"
                          value={rate.deliveryTime}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            if (!newVariants[index].shippingRates) return;
                            newVariants[index].shippingRates![
                              rIndex
                            ].deliveryTime = e.target.value;
                            setVariants(newVariants);
                          }}
                          placeholder="Time"
                          className={styles.shippingRateInput}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
