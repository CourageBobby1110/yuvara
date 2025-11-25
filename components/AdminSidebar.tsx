"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminSidebar.module.css";
import { handleSignOut } from "@/app/actions/auth";
import MessageNotification from "./MessageNotification";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

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
            href="/"
            className={styles.logo}
            onClick={() => setIsOpen(false)}
          >
            Yuvara Admin
          </Link>
          <MessageNotification />
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
            href="/admin/products"
            className={`${styles.link} ${
              isActive("/admin/products") ? styles.active : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            Products
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
            href="/admin/favorites"
            className={`${styles.link} ${
              isActive("/admin/favorites") ? styles.active : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            Favorites
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
            href="/admin/hero"
            className={`${styles.link} ${
              isActive("/admin/hero") ? styles.active : ""
            }`}
            onClick={() => setIsOpen(false)}
          >
            Hero Image
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
        </nav>

        <button onClick={() => handleSignOut()} className={styles.logoutButton}>
          Sign Out
        </button>
      </aside>
    </>
  );
}
