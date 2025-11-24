"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import Image from "next/image";

import styles from "./AdminProductForm.module.css";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    slug: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from name
    if (name === "name") {
      setFormData((prev) => ({ 
        ...prev, 
        name: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") 
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
              placeholder="e.g. 7, 8, 9, 10"
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label}>Colors (comma separated)</label>
            <input
              type="text"
              name="colors"
              placeholder="e.g. Red, Blue, Black"
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
                  setImages((prev) => [...prev, ...res.map((file) => file.url)]);
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
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    className={styles.removeImageButton}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
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
