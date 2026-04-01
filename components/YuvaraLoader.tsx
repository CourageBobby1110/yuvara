import React from "react";
import Image from "next/image";
import styles from "./YuvaraLoader.module.css";

interface YuvaraLoaderProps {
  text?: string;
  size?: number;
}

export default function YuvaraLoader({
  text = "Loading...",
  size = 60,
}: YuvaraLoaderProps) {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.logoWrapper} style={{ width: size, height: size }}>
        <Image
          src="/icon-v2.svg"
          alt="Loading..."
          fill
          style={{ objectFit: "contain" }}
        />
      </div>
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  );
}
