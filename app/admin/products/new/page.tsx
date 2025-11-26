"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { useCurrency } from "@/context/CurrencyContext";

import styles from "./AdminProductForm.module.css";

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
          images,
          videos,
          variants: variants.map((v) => ({
            ...v,
            price: parseFloat(v.price),
            stock: parseInt(v.stock),
          })),
          colors: Array.from(new Set(variants.map((v) => v.color))).filter(
            Boolean
          ),
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
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className={styles.select}
            >
              <option value="">Select Category</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={styles.label}>Product URL (Optional)</label>
          <input
            type="url"
            name="productUrl"
            value={formData.productUrl}
            onChange={handleChange}
            className={styles.input}
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
                  alert("Upload Completed");
                }
              }}
              onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
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
                  alert("Video Upload Completed");
                }
              }}
              onUploadError={(error: Error) => {
                alert(`ERROR! ${error.message}`);
              }}
            />
          </div>

          {videos.length > 0 && (
            <div className={styles.imagesGrid}>
              {videos.map((url, index) => (
                <div key={index} className={styles.imageWrapper}>
                  <video
                    src={url}
                    controls
                    className={styles.image} // Reusing image class for sizing
                    style={{ objectFit: "cover" }}
                  />
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
                  },
                ])
              }
              className={styles.addVariantButton}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#f3f4f6",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              + Add Variant
            </button>
          </div>

          {variants.map((variant, index) => (
            <div
              key={index}
              className={styles.variantCard}
              style={{
                border: "1px solid #e5e7eb",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                backgroundColor: "#f9fafb",
              }}
            >
              <div className="flex justify-between mb-2">
                <h4 className="font-medium">Variant {index + 1}</h4>
                <button
                  type="button"
                  onClick={() =>
                    setVariants(variants.filter((_, i) => i !== index))
                  }
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className={styles.grid2}>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
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
                  <label className="text-xs text-gray-500 mb-1 block">
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
                  <label className="text-xs text-gray-500 mb-1 block">
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
                  <label className="text-xs text-gray-500 mb-1 block">
                    Variant Image
                  </label>
                  {variant.image ? (
                    <div className="relative w-20 h-20">
                      <Image
                        src={variant.image}
                        alt="Variant"
                        fill
                        className="object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = [...variants];
                          newVariants[index].image = "";
                          setVariants(newVariants);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
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
                        },
                        container: { padding: "0.5rem" },
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
