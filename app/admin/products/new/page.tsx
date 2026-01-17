"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { useCurrency } from "@/context/CurrencyContext";

// Point to the shared CSS module
import styles from "../ProductForm.module.css";

export default function NewProductPage() {
  const router = useRouter();
  const { exchangeRates } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    shippingFee: "0",
    slug: "",
    sizes: "",
    productUrl: "",
  });
  const [variants, setVariants] = useState<
    {
      color: string;
      image: string;
      price: string;
      stock: string;
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add New Product</h1>

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
            <label className={styles.label}>Slug</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className={`${styles.input} ${styles.inputSlug}`}
            />
          </div>
        </div>

        <div>
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

        <div className={styles.grid3}>
          <div>
            <label className={styles.label}>Price ($)</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
              <button
                type="button"
                onClick={() => {
                  const currentPrice = parseFloat(formData.price) || 0;
                  const newPrice = (currentPrice + 3).toFixed(2);
                  setFormData((prev) => ({ ...prev, price: newPrice }));

                  // Update all variants
                  const newVariants = variants.map((v) => ({
                    ...v,
                    price: (parseFloat(v.price || "0") + 3).toFixed(2),
                  }));
                  setVariants(newVariants);
                }}
                className={styles.addVariantButton}
                style={{
                  whiteSpace: "nowrap",
                  padding: "0.75rem",
                  fontSize: "0.8rem",
                }}
              >
                +$3 Markup
              </button>
            </div>
            {renderCurrencyPreviews(formData.price)}
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

        <div className={styles.variantsSection}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <label className={styles.label} style={{ marginBottom: 0 }}>
              Shipping Rates (Multi-Country)
            </label>
            <button
              type="button"
              onClick={() =>
                setShippingRates([
                  ...shippingRates,
                  {
                    countryCode: "",
                    countryName: "",
                    price: "0",
                    method: "",
                    deliveryTime: "",
                  },
                ])
              }
              className={styles.addVariantButton}
            >
              + Add Rate
            </button>
          </div>

          {shippingRates.map((rate, index) => (
            <div key={index} className={styles.variantCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <h4 style={{ fontWeight: 600 }}>Rate {index + 1}</h4>
                <button
                  type="button"
                  onClick={() =>
                    setShippingRates(
                      shippingRates.filter((_, i) => i !== index),
                    )
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
                  <label
                    className={styles.label}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Country Code
                  </label>
                  <input
                    type="text"
                    value={rate.countryCode}
                    onChange={(e) => {
                      const newRates = [...shippingRates];
                      newRates[index].countryCode =
                        e.target.value.toUpperCase();
                      setShippingRates(newRates);
                    }}
                    placeholder="NG"
                    className={styles.input}
                    required
                  />
                </div>
                <div>
                  <label
                    className={styles.label}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Country Name
                  </label>
                  <input
                    type="text"
                    value={rate.countryName}
                    onChange={(e) => {
                      const newRates = [...shippingRates];
                      newRates[index].countryName = e.target.value;
                      setShippingRates(newRates);
                    }}
                    placeholder="Nigeria"
                    className={styles.input}
                    required
                  />
                </div>
                <div>
                  <label
                    className={styles.label}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={rate.price}
                    onChange={(e) => {
                      const newRates = [...shippingRates];
                      newRates[index].price = e.target.value;
                      setShippingRates(newRates);
                    }}
                    className={styles.input}
                    required
                  />
                </div>
                <div>
                  <label
                    className={styles.label}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Method (Optional)
                  </label>
                  <input
                    type="text"
                    value={rate.method}
                    onChange={(e) => {
                      const newRates = [...shippingRates];
                      newRates[index].method = e.target.value;
                      setShippingRates(newRates);
                    }}
                    placeholder="DHL"
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
          ))}
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
              placeholder="e.g. 7, 8, 9, 10"
              onChange={handleChange}
              className={styles.input}
            />
          </div>
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

        <div>
          <label className={styles.label}>Product Video</label>
          <div className={styles.uploadContainer}>
            <UploadDropzone
              endpoint="videoUploader"
              onClientUploadComplete={(res) => {
                if (res) {
                  setVideos((prev) => [
                    ...prev,
                    ...res.map((file) => file.url),
                  ]);
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

          {videos.length > 0 && (
            <div className={styles.imagesGrid}>
              {videos.map((url, index) => (
                <div key={index} className={styles.imageWrapper}>
                  <video src={url} controls className={styles.image} />
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <label className={styles.label} style={{ marginBottom: 0 }}>
              Product Variants
            </label>
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <h4 style={{ fontWeight: 600 }}>Variant {index + 1}</h4>
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
                  <label
                    className={styles.label}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Color Name
                  </label>
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
                  <label
                    className={styles.label}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Price Override
                  </label>
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
                  <label
                    className={styles.label}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Stock
                  </label>
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => {
                      const newVariants = [...variants];
                      newVariants[index].stock = e.target.value;
                      setVariants(newVariants);
                    }}
                    className={styles.input}
                  />
                </div>
                <div>
                  <label
                    className={styles.label}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Variant Image
                  </label>
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
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
