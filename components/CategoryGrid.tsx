import Image from "next/image";
import Link from "next/link";
import styles from "./CategoryGrid.module.css";

export default function CategoryGrid() {
  const categories = [
    {
      title: "Men",
      image: "/men-category.jpg", // We'll need to ensure these images exist or use placeholders
      link: "/collections?category=Men",
    },
    {
      title: "Women",
      image: "/women-category.jpg",
      link: "/collections?category=Women",
    },
    {
      title: "Accessories",
      image: "/accessories-category.jpg",
      link: "/collections?category=Accessories",
    },
  ];

  return (
    <section className={styles.grid}>
      {categories.map((category) => (
        <Link key={category.title} href={category.link} className={styles.card}>
          <Image
            src={category.image}
            alt={category.title}
            fill
            className={styles.image}
            style={{ objectFit: "cover" }}
          />
          <div className={styles.overlay}>
            <h3 className={styles.title}>{category.title}</h3>
            <span className={styles.link}>
              Shop Now 
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
