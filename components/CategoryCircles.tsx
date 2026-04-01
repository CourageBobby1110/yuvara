import Image from "next/image";
import Link from "next/link";
import styles from "./CategoryCircles.module.css";

interface Category {
  name: string;
  fullName: string;
  image: string;
}

interface CategoryCirclesProps {
  categories: Category[];
}

export default function CategoryCircles({ categories }: CategoryCirclesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className={styles.container}>
      <div className={styles.scrollTrack}>
        {categories.map((category, index) => (
          <Link
            key={`${category.name}-${index}`}
            href={`/collections?category=${encodeURIComponent(category.fullName)}`}
            className={styles.categoryCard}
          >
            <div className={styles.imageWrapper}>
              <div className={styles.imageInner}>
                <Image
                  src={category.image || "/placeholder.png"}
                  alt={category.name}
                  fill
                  className={styles.image}
                  sizes="80px"
                />
              </div>
            </div>
            <span className={styles.label}>{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
