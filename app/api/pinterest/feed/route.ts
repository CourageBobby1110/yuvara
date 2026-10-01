import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
        default:
          return c;
      }
    });
}

function cleanHtml(raw: string): string {
  if (!raw) return "";
  return raw.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    await dbConnect();

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.URL ||
      "https://yuvara.com.ng";

    const products = (await Product.find({}).lean()) as any[];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>YuVara Product Catalog</title>
    <link>${baseUrl}</link>
    <description>YuVara Official Catalog Feed for Pinterest Shopping and Rich Pins</description>
`;

    for (const prod of products) {
      const id = String(prod._id || "");
      const title = escapeXml(prod.name || "YuVara Product");
      const desc = escapeXml(cleanHtml(prod.description || prod.name || "").slice(0, 5000));
      const link = `${baseUrl}/products/${prod.slug}`;

      let imageUrl = prod.images?.[0] || "";
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
      }
      if (!imageUrl) {
        imageUrl = `${baseUrl}/icon.png`;
      }

      const price = `${Number(prod.price || 0).toFixed(2)} USD`;
      const availability = (prod.stock ?? 0) > 0 ? "in stock" : "out of stock";
      const category = escapeXml(prod.category || "Apparel &amp; Accessories");

      xml += `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:price>${price}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>YuVara</g:brand>
      <g:product_type>${category}</g:product_type>
    </item>\n`;
    }

    xml += `  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating Pinterest catalog feed:", error);
    return new NextResponse("Error generating catalog feed", { status: 500 });
  }
}
