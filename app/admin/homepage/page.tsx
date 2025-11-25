"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./HomepageAdmin.module.css";
import AdminLoader from "@/components/AdminLoader";
import { useRouter } from "next/navigation";

export default function HomepageAdminPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Temporary state for uploads before saving
  const [tempImages, setTempImages] = useState<{ [key: string]: string }>({});

  // Presets
  const PRESETS = {
    men: [
      "/men-category.jpg",
      "/presets/men-preset-1.png",
      "/presets/men-preset-2.png",
    ],
    women: [
      "/women-category.jpg",
      "/presets/women-preset-1.png",
      "/presets/women-preset-2.png",
    ],
    accessories: [
      "/accessories-category.jpg",
      "/presets/accessories-preset-1.png",
      "/presets/accessories-preset-2.png",
    ],
    brandStory: ["/brand-story.png", "/presets/brand-story-preset-1.png"],
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/admin/settings/homepage?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch settings", error);
      alert("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImages((prev) => ({ ...prev, [key]: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Upload the file
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setTempImages((prev) => ({ ...prev, [key]: data.url }));
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    }
  };

  const handlePresetSelect = (key: string, src: string) => {
    setTempImages((prev) => ({ ...prev, [key]: src }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {};

      // Prepare category images update
      if (
        tempImages["men"] ||
        tempImages["women"] ||
        tempImages["accessories"]
      ) {
        updateData.categoryImages = {
          men: tempImages["men"] || settings.categoryImages?.men,
          women: tempImages["women"] || settings.categoryImages?.women,
          accessories:
            tempImages["accessories"] || settings.categoryImages?.accessories,
        };
      }

      // Prepare brand story image update
      if (tempImages["brandStory"]) {
        updateData.brandStoryImage = tempImages["brandStory"];
      }

      const res = await fetch("/api/admin/settings/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Failed to update");

      const updatedSettings = await res.json();
      setSettings(updatedSettings);

      // Clear temp images only after successful save and state update
      setTempImages({});

      // Force router refresh to update server components and cache
      router.refresh();

      // Fetch fresh settings to ensure client state is synced
      await fetchSettings();

      alert("Homepage settings updated successfully");
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoader />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Homepage Management</h1>
        <p className={styles.subtitle}>
          Manage images for the Category Grid and Brand Story sections.
        </p>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving || Object.keys(tempImages).length === 0}
        >
          {saving ? "Updating..." : "Save Changes"}
        </button>
      </div>

      {/* Category Grid Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Category Grid Images</h2>
        <div className={styles.grid}>
          {/* Men */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Men</h3>
            <div className={styles.imagePreview}>
              <Image
                src={
                  tempImages["men"] ||
                  settings?.categoryImages?.men ||
                  "/men-category.jpg"
                }
                alt="Men Category"
                fill
                className={styles.image}
              />
            </div>
            <div className={styles.presets}>
              <p className={styles.presetLabel}>Select Preset:</p>
              <div className={styles.presetGrid}>
                {PRESETS.men.map((src, idx) => (
                  <div
                    key={idx}
                    className={`${styles.presetThumb} ${
                      (tempImages["men"] === src ||
                        (!tempImages["men"] &&
                          settings?.categoryImages?.men === src)) &&
                      styles.activePreset
                    }`}
                    onClick={() => handlePresetSelect("men", src)}
                  >
                    <Image
                      src={src}
                      alt={`Preset ${idx + 1}`}
                      fill
                      className={styles.image}
                    />
                  </div>
                ))}
              </div>
            </div>
            <label className={styles.uploadButton}>
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "men")}
                hidden
              />
            </label>
          </div>

          {/* Women */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Women</h3>
            <div className={styles.imagePreview}>
              <Image
                src={
                  tempImages["women"] ||
                  settings?.categoryImages?.women ||
                  "/women-category.jpg"
                }
                alt="Women Category"
                fill
                className={styles.image}
              />
            </div>
            <div className={styles.presets}>
              <p className={styles.presetLabel}>Select Preset:</p>
              <div className={styles.presetGrid}>
                {PRESETS.women.map((src, idx) => (
                  <div
                    key={idx}
                    className={`${styles.presetThumb} ${
                      (tempImages["women"] === src ||
                        (!tempImages["women"] &&
                          settings?.categoryImages?.women === src)) &&
                      styles.activePreset
                    }`}
                    onClick={() => handlePresetSelect("women", src)}
                  >
                    <Image
                      src={src}
                      alt={`Preset ${idx + 1}`}
                      fill
                      className={styles.image}
                    />
                  </div>
                ))}
              </div>
            </div>
            <label className={styles.uploadButton}>
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "women")}
                hidden
              />
            </label>
          </div>

          {/* Accessories */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Accessories</h3>
            <div className={styles.imagePreview}>
              <Image
                src={
                  tempImages["accessories"] ||
                  settings?.categoryImages?.accessories ||
                  "/accessories-category.jpg"
                }
                alt="Accessories Category"
                fill
                className={styles.image}
              />
            </div>
            <div className={styles.presets}>
              <p className={styles.presetLabel}>Select Preset:</p>
              <div className={styles.presetGrid}>
                {PRESETS.accessories.map((src, idx) => (
                  <div
                    key={idx}
                    className={`${styles.presetThumb} ${
                      (tempImages["accessories"] === src ||
                        (!tempImages["accessories"] &&
                          settings?.categoryImages?.accessories === src)) &&
                      styles.activePreset
                    }`}
                    onClick={() => handlePresetSelect("accessories", src)}
                  >
                    <Image
                      src={src}
                      alt={`Preset ${idx + 1}`}
                      fill
                      className={styles.image}
                    />
                  </div>
                ))}
              </div>
            </div>
            <label className={styles.uploadButton}>
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "accessories")}
                hidden
              />
            </label>
          </div>
        </div>
      </div>

      {/* Brand Story Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Master in Every Stitch (Brand Story)
        </h2>
        <div className={styles.card}>
          <div className={styles.imagePreviewLarge}>
            <Image
              src={
                tempImages["brandStory"] ||
                settings?.brandStoryImage ||
                "/brand-story.png"
              }
              alt="Brand Story"
              fill
              className={styles.image}
            />
          </div>
          <div className={styles.presets}>
            <p className={styles.presetLabel}>Select Preset:</p>
            <div className={styles.presetGrid}>
              {PRESETS.brandStory.map((src, idx) => (
                <div
                  key={idx}
                  className={`${styles.presetThumb} ${
                    (tempImages["brandStory"] === src ||
                      (!tempImages["brandStory"] &&
                        settings?.brandStoryImage === src)) &&
                    styles.activePreset
                  }`}
                  onClick={() => handlePresetSelect("brandStory", src)}
                >
                  <Image
                    src={src}
                    alt={`Preset ${idx + 1}`}
                    fill
                    className={styles.image}
                  />
                </div>
              ))}
            </div>
          </div>
          <label className={styles.uploadButton}>
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, "brandStory")}
              hidden
            />
          </label>
        </div>
      </div>
    </div>
  );
}
