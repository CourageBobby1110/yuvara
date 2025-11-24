"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./HeroAdmin.module.css";

// Placeholder presets since generation failed
const PRESETS = [
  "/hero-shoe-minimalist.png",
  "/hero-shoe-vibrant.png",
  "/hero-shoe.png",
  // Add more placeholders if available or reuse
  "/hero-shoe-minimalist.png",
  "/hero-shoe-vibrant.png",
];

export default function HeroAdminPage() {
  const [currentImage, setCurrentImage] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings/hero");
      const data = await res.json();
      if (data.heroImageUrl) {
        setCurrentImage(data.heroImageUrl);
        setSelectedImage(data.heroImageUrl);
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      alert("Failed to load current settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroImageUrl: selectedImage }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setCurrentImage(selectedImage);
      alert("Hero image updated successfully");
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to update hero image");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ideally, upload to a server/cloud storage here.
    // For now, we'll simulate by reading as data URL (not recommended for prod but works for demo)
    // Or if you have an upload API, use that.
    // Since we don't have a dedicated upload API ready in the plan,
    // I will skip actual file upload implementation and just show a toast.
    // In a real app, this would POST to /api/upload
    alert("Custom upload not fully implemented in this demo step.");

    // Simulating a local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hero Image Management</h1>
        <p className={styles.subtitle}>
          Select a preset or upload your own image for the home page hero
          section.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Current Preview</h2>
        <div className={styles.currentImageContainer}>
          {selectedImage && (
            <Image
              src={selectedImage}
              alt="Hero Preview"
              fill
              className={styles.image}
            />
          )}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving || selectedImage === currentImage}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Presets</h2>
        <div className={styles.grid}>
          {PRESETS.map((src, index) => (
            <div
              key={index}
              className={`${styles.presetCard} ${
                selectedImage === src ? styles.active : ""
              }`}
              onClick={() => setSelectedImage(src)}
            >
              <Image
                src={src}
                alt={`Preset ${index + 1}`}
                fill
                className={styles.image}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Upload Custom Image</h2>
        <label className={styles.uploadContainer}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            hidden
          />
          <span className={styles.uploadIcon}>+</span>
          <span className={styles.uploadText}>Click to upload image</span>
        </label>
      </div>
    </div>
  );
}
