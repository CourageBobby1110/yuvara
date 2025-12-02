"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Login.module.css";

export default function InvestmentLoginPage() {
  const [accessPin, setAccessPin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/invest/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessPin, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token
      localStorage.setItem("investorToken", data.token);
      localStorage.setItem("investorName", data.name);

      router.push("/invest/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Investor Portal</h1>
          <p className={styles.subtitle}>
            Enter your Access Pin and Password to view your dashboard
          </p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="accessPin" className={styles.label}>
              Access Pin (Serial Number)
            </label>
            <input
              id="accessPin"
              name="accessPin"
              type="text"
              required
              className={styles.input}
              placeholder="Enter your serial number"
              value={accessPin}
              onChange={(e) => setAccessPin(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitButton} ${
                loading ? styles.submitButtonDisabled : ""
              }`}
            >
              {loading ? "Verifying..." : "Access Dashboard"}
            </button>
          </div>
        </form>

        <div className={styles.footer}>
          <Link href="/" className={styles.link}>
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
