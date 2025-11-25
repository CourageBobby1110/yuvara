import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await auth();
    // Check for admin role
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      email,
      userName,
      productName,
      productImage,
      productPrice,
      productSlug,
    } = await req.json();

    if (!email || !productName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email content
    const subject = `Quick question about your wishlist item: ${productName}`;
    const text = `Hi ${userName},\n\nWe noticed you have your eye on the ${productName}.\n\nIt's a fantastic choice. Why not make it yours today?\n\nPrice: ₦${productPrice.toLocaleString()}\n\nShop Now: ${
      process.env.NEXT_PUBLIC_APP_URL
    }/products/${productSlug}\n\n\n© ${new Date().getFullYear()} Yuvara. All rights reserved.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #000;">YUVARA</h1>
        </div>
        <div style="padding: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Hi ${userName},</h2>
        <p style="font-size: 16px; color: #333;">
          We noticed you have your eye on the <strong>${productName}</strong>.
        </p>
        <div style="margin: 20px 0; text-align: center;">
          <img src="${productImage}" alt="${productName}" style="max-width: 100%; height: auto; border-radius: 8px;" />
          <p style="font-size: 18px; font-weight: bold; margin-top: 10px;">₦${productPrice.toLocaleString()}</p>
        </div>
        <p style="font-size: 16px; color: #333;">
          It's a fantastic choice. Why not make it yours today?
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${
            process.env.NEXT_PUBLIC_APP_URL
          }/products/${productSlug}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Shop Now
          </a>
        </div>
        </div>
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Yuvara. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendMail({
      to: email,
      subject,
      html,
      text,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
