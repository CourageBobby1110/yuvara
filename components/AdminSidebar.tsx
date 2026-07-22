"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { hardSignOut } from "@/lib/sign-out";
import styles from "./AdminSidebar.module.css";
import { ExternalLink } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const isAdmin = session?.user?.role === "admin";
  const isWorker = session?.user?.role === "worker";

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      <div
        className={`${styles.backdrop} ${isOpen ? styles.open : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <Link
            href="/admin/dashboard"
            className={styles.logo}
            onClick={() => setIsOpen(false)}
          >
            <Image
              src="/icon.png"
              alt="YuVara Admin"
              fill
              sizes="64px"
              priority
              className={styles.logoImage}
            />
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link
            href="/admin/dashboard"
            className={`${styles.link} ${
              isActive("/admin/dashboard") &&
              !isActive("/admin/products") &&
              !isActive("/admin/orders")
                ? styles.active
                : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            Overview
          </Link>

          <Link
            href="/"
            className={styles.link}
            onClick={() => setIsOpen(false)}
            target="_blank"
          >
            Go Home
            <ExternalLink size={14} style={{ opacity: 0.5 }} />
          </Link>

          {!isWorker && (
            <Link
              href="/admin/analytics"
              className={`${styles.link} ${
                isActive("/admin/analytics") ? styles.active : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              Analytics
            </Link>
          )}

          <Link
            href="/admin/products"
            className={`${styles.link} ${
              isActive("/admin/products") && !isActive("/admin/products/import") && !isActive("/admin/products/bulk-import") ? styles.active : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            Products
          </Link>
          {!isWorker && (
            <>
              <Link
                href="/admin/products/import"
                className={`${styles.link} ${
                  isActive("/admin/products/import") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Import Product
              </Link>
              <Link
                href="/admin/products/bulk-import"
                className={`${styles.link} ${
                  isActive("/admin/products/bulk-import") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Bulk Import
              </Link>
            </>
          )}

          {!isWorker && (
            <>
              <Link
                href="/admin/dropshipping"
                className={`${styles.link} ${
                  isActive("/admin/dropshipping") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                CJ Dropshipping
              </Link>
              <Link
                href="/admin/cjdropshippingv2"
                className={`${styles.link} ${
                  isActive("/admin/cjdropshippingv2") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                CJ Exact Search
              </Link>
              <Link
                href="/admin/doba/search"
                className={`${styles.link} ${
                  isActive("/admin/doba") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Doba Dropshipping
              </Link>
              <Link
                href="/admin/orders"
                className={`${styles.link} ${
                  isActive("/admin/orders") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Orders
              </Link>
              <Link
                href="/admin/shipping"
                className={`${styles.link} ${
                  isActive("/admin/shipping") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Shipping
              </Link>
              <Link
                href="/admin/coupons"
                className={`${styles.link} ${
                  isActive("/admin/coupons") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Coupons
              </Link>
              <Link
                href="/admin/gift-cards"
                className={`${styles.link} ${
                  isActive("/admin/gift-cards") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Gift Cards
              </Link>
              <Link
                href="/admin/users"
                className={`${styles.link} ${
                  isActive("/admin/users") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Customers
              </Link>
              <Link
                href="/admin/marketing"
                className={`${styles.link} ${
                  isActive("/admin/marketing") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Marketing
              </Link>
              <Link
                href="/admin/newsletter"
                className={`${styles.link} ${
                  isActive("/admin/newsletter") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Newsletter
              </Link>
              <Link
                href="/admin/affiliates"
                className={`${styles.link} ${
                  isActive("/admin/affiliates") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Affiliates
              </Link>
              <Link
                href="/admin/investors"
                className={`${styles.link} ${
                  isActive("/admin/investors") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Investments
              </Link>
              <Link
                href="/admin/withdrawals"
                className={`${styles.link} ${
                  isActive("/admin/withdrawals") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Withdrawals
              </Link>
              <Link
                href="/admin/referrals"
                className={`${styles.link} ${
                  isActive("/admin/referrals") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Referrals
              </Link>
              <Link
                href="/admin/messages"
                className={`${styles.link} ${
                  isActive("/admin/messages") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Messages
              </Link>
              <Link
                href="/admin/whatsapp"
                className={`${styles.link} ${
                  isActive("/admin/whatsapp") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                WhatsApp Bot
              </Link>
              <Link
                href="/admin/favorites"
                className={`${styles.link} ${
                  isActive("/admin/favorites") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Favorites
              </Link>
              <Link
                href="/admin/homepage"
                className={`${styles.link} ${
                  isActive("/admin/homepage") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Homepage
              </Link>
              <Link
                href="/admin/settings/investment"
                className={`${styles.link} ${
                  isActive("/admin/settings/investment") ? styles.active : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                Investment Settings
              </Link>
            </>
          )}

          {/* Settings - Visible to everyone, but links to worker-settings for workers */}
          <Link
            href={isWorker ? "/admin/worker-settings" : "/admin/settings"}
            className={`${styles.link} ${
              isActive("/admin/settings") || isActive("/admin/worker-settings")
                ? styles.active
                : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
        </nav>

        <button onClick={() => void hardSignOut()} className={styles.logoutButton}>
          Sign Out
        </button>
      </aside>
    </>
  );
}
