"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./Profile.module.css";

const AVATARS = [
  // Custom Generated Professional Avatars
  "/avatars/avatar_professional_1_1763960689427.png",
  "/avatars/avatar_professional_2_1763960706904.png",
  "/avatars/avatar_professional_3_1763960728618.png",
  "/avatars/avatar_professional_4_1763960760678.png",
  "/avatars/avatar_professional_5_1763960776543.png",
  "/avatars/avatar_professional_6_1763960835987.png",
  "/avatars/avatar_professional_7_1763960853888.png",
  // Professional DiceBear Avatars (Business Style)
  "https://api.dicebear.com/7.x/notionists/svg?seed=Professional1",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Professional2",
  "https://api.dicebear.com/7.x/notionists/svg?seed=Professional3",
];

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || AVATARS[0],
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedUser.name,
            email: updatedUser.email,
            image: updatedUser.image,
          },
        });
        alert("Profile updated successfully!");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className={styles.container}>Please sign in to view this page.</div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Profile</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Choose Avatar</h2>
          <div className={styles.avatarGrid}>
            {AVATARS.map((url, index) => (
              <div
                key={index}
                className={`${styles.avatarWrapper} ${
                  formData.image === url ? styles.selectedAvatar : ""
                }`}
                onClick={() => setFormData({ ...formData, image: url })}
              >
                <Image
                  src={url}
                  alt={`Avatar ${index + 1}`}
                  width={80}
                  height={80}
                  className={styles.avatar}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles.input}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={styles.input}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
