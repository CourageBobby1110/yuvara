"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { Camera, Save, CheckCircle } from "lucide-react";
import styles from "./WorkerSettings.module.css";
import AdminLoader from "@/components/AdminLoader";

export default function WorkerSettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  if (!session) return <AdminLoader />;

  const handleUpdateProfile = async (imageUrl?: string) => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          image: imageUrl || session.user?.image,
        }),
      });

      if (res.ok) {
        // Trigger session update to refresh UI everywhere
        await update({
          ...session,
          user: {
            ...session.user,
            name: name,
            image: imageUrl || session.user?.image,
          },
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Worker Settings</h1>

      <div className={styles.card}>
        <div className={styles.profileSection}>
          <div className={styles.imageWrapper}>
            <Image
              src={session.user?.image || "/placeholder-user.png"}
              alt="Profile"
              fill
              className={styles.profileImage}
              priority
            />
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "yuvara_preset"}
              onSuccess={(result: any) => {
                if (result.info?.secure_url) {
                  handleUpdateProfile(result.info.secure_url);
                }
              }}
            >
              {({ open }) => (
                <div className={styles.uploadOverlay} onClick={() => open()}>
                  <Camera size={20} style={{ marginBottom: "4px" }} />
                  <div>Change Photo</div>
                </div>
              )}
            </CldUploadWidget>
          </div>
          
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{session.user?.name}</h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem" }}>{session.user?.email}</p>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Display Name</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {success && (
            <div className={styles.successMessage}>
              <CheckCircle size={16} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <button
            onClick={() => handleUpdateProfile()}
            className={styles.saveButton}
            disabled={loading || !name}
          >
            {loading ? "Updating..." : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
