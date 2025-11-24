"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";
import AdminLoader from "@/components/AdminLoader";
import styles from "../new/AdminProductForm.module.css";
import { useCurrency } from "@/context/CurrencyContext";

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
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const { currency, setCurrency, formatPrice } = useCurrency();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    slug: "",
    sizes: "",
    colors: "",
    reviewsEnabled: true,
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const product: Product = await res.json();
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          stock: product.stock.toString(),
          slug: product.slug,
          sizes: product.sizes?.join(", ") || "",
          colors: product.colors?.join(", ") || "",
          reviewsEnabled: product.reviewsEnabled ?? true,
        });
        setImages(product.images || []);
        setVideos(product.videos || []);
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
    setLoading(true);

    try {
      const updateData: any = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        images,
        videos,
      };

      // Parse sizes and colors if provided
      if (formData.sizes) {
        updateData.sizes = formData.sizes
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }
      if (formData.colors) {
        updateData.colors = formData.colors
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c);
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
      setLoading(false);
    }
  };

  if (fetching) {
    return <AdminLoader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Product</h1>
        <div className={styles.currencyWrapper}>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className={styles.currencySelect}
            style={{
              padding: "0.5rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "0.875rem",
            }}
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
            <div className="relative">
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
              {formData.price && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.875rem",
                    color: "#666",
                  }}
                >
                  ≈ {formatPrice(parseFloat(formData.price))}
                </div>
              )}
            </div>
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
              <option value="Sneakers">Sneakers</option>
              <option value="Boots">Boots</option>
              <option value="Loafers">Loafers</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
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
          <div>
            <label className={styles.label}>Colors (comma separated)</label>
            <input
              type="text"
              name="colors"
              value={formData.colors}
              onChange={handleChange}
              placeholder="e.g. Red, Blue, Black"
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

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? "Updating..." : "Update Product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
