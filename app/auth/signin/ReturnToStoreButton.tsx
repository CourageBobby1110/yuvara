"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./SignIn.module.css";

export default function ReturnToStoreButton() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  return (
    <button
      onClick={() => {
        setNavigating(true);
        router.push("/");
      }}
      className={styles.returnLink}
      disabled={navigating}
    >
      {navigating ? "Returning to Store..." : "Return to Store"}
    </button>
  );
}
