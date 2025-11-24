"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./MessageNotification.module.css";

export default function MessageNotification() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (res.ok) {
        const unread = data.messages.filter(
          (msg: any) => msg.status === "unread"
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  return (
    <Link href="/admin/messages" className={styles.bellIcon}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
    </Link>
  );
}
