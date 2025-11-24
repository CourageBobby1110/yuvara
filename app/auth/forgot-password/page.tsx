"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./ForgotPassword.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setEmail("");
      } else {
        setError(data.error || "An error occurred");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundWrapper}>
        <div className={styles.backgroundOverlay} />
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.card}>
          <div className={styles.cardHighlight} />

          <div className={styles.header}>
            <h1 className={styles.title}>Forgot Password?</h1>
            <p className={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {message && (
            <div className={`${styles.message} ${styles.success}`}>
              {message}
            </div>
          )}
          {error && (
            <div className={`${styles.message} ${styles.error}`}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
                placeholder="name@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Remember your password?{" "}
              <Link href="/auth/signin" className={styles.link}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
