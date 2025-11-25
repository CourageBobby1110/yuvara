import Image from "next/image";
import Link from "next/link";
import styles from "./BrandStory.module.css";

interface BrandStoryProps {
  image?: string;
}

export default function BrandStory({ image }: BrandStoryProps) {
  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <span className={styles.label}>The Atelier</span>
        <h2 className={styles.title}>
          Mastery in <br /> Every Stitch
        </h2>
        <p className={styles.description}>
          Our artisans dedicate decades to perfecting the art of design. Each
          piece is a testament to time-honored traditions, blended with modern
          innovation to create fashion that stands the test of time.
        </p>
        <Link href="/about" className={styles.link}>
          Read Our Story
        </Link>
      </div>
      <div className={styles.imageWrapper}>
        <Image
          src={image || "/brand-story.png"}
          alt="Artisan at work"
          fill
          className={styles.image}
        />
      </div>
    </section>
  );
}
