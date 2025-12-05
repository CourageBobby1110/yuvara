import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";
import { getProductBySlug } from "@/lib/products";

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
      images: product.images.length > 0 ? [product.images[0]] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description.substring(0, 160),
      images: product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductClient key={product._id} initialProduct={product as any} />;
}
