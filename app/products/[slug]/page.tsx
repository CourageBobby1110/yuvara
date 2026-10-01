import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";
import { getProductBySlug } from "@/lib/products";
import { getValidUrl } from "@/lib/utils";

// Cache this page at the Netlify Edge for 1 hour
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Yuvara",
    };
  }

  return {
    title: `${product.name} | Yuvara`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      images: product.images.length > 0 ? [getValidUrl(product.images[0])] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description.substring(0, 160),
      images: product.images.length > 0 ? [getValidUrl(product.images[0])] : [],
    },
    other: {
      "product:price:amount": String(product.price || 0),
      "product:price:currency": "USD",
      "product:availability": (product.stock ?? 0) > 0 ? "in stock" : "out of stock",
      "product:brand": "YuVara",
      "og:price:amount": String(product.price || 0),
      "og:price:currency": "USD",
      "og:availability": (product.stock ?? 0) > 0 ? "instock" : "oos",
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images?.map((img: string) => getValidUrl(img)) || [],
    description:
      product.description?.replace(/<[^>]*>?/gm, "").substring(0, 500) || "",
    sku: product._id?.toString(),
    brand: {
      "@type": "Brand",
      name: "YuVara",
    },
    offers: {
      "@type": "Offer",
      url: `https://yuvara.com.ng/products/${product.slug}`,
      priceCurrency: "USD",
      price: Number(product.price || 0).toFixed(2),
      availability:
        (product.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClient key={product._id} initialProduct={product as any} />
    </>
  );
}
