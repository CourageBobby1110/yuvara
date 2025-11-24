"use client";

import { useState } from "react";
import Link from "next/link";
import { handleSignIn } from "@/app/actions/auth";
import styles from "./SignInForm.module.css";

export default function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <form
      action={async (formData) => {
        setLoading(true);
        // Append callbackUrl to formData if needed by the auth provider,
        // or just rely on the server action to handle it if we passed it differently.
        // For next-auth credentials, we usually pass redirectTo in the signIn options.
        // Since handleSignIn wraps signIn, we might need to update handleSignIn to accept redirectTo.
        // But for now, let's assume the server action handles the basic credential flow.
        // Actually, to be safe and support callbackUrl, let's pass it as a hidden field
        formData.append("redirectTo", callbackUrl);
        await handleSignIn(formData);
        // We don't set loading false because we expect a redirect
      }}
      className={styles.form}
    >
      <div className={styles.inputGroup}>
        <label className={styles.label}>Email Address</label>
        <div className={styles.inputWrapper}>
          <input
            name="email"
            type="email"
            required
            className={styles.input}
            placeholder="name@example.com"
          />
        </div>
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Password</label>
        <div className={styles.inputWrapper}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            className={`${styles.input} ${styles.passwordInput}`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.toggleButton}
          >
            {showPassword ? (
              <svg
                className={styles.icon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className={styles.icon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        <Link
          href="/auth/forgot-password"
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            textAlign: "right",
            display: "block",
            marginTop: "0.5rem",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-secondary)";
          }}
        >
          Forgot Password?
        </Link>
      </div>

      <button type="submit" disabled={loading} className={styles.submitButton}>
        {loading ? (
          <span className={styles.loadingContent}>
            <svg className={styles.spinner} viewBox="0 0 24 24">
              <circle
                className={styles.spinnerCircle}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className={styles.spinnerPath}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing In...
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
