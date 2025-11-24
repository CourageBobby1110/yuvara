import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { sendContactFormNotification } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { name, email, message } = await req.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Create contact message in database
    const contactMessage = await ContactMessage.create({
      name,
      email,
      message,
      status: "unread",
    });

    // Send email notification to admin
    try {
      await sendContactFormNotification(
        name,
        email,
        message,
        contactMessage._id.toString()
      );
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      message: "Thank you for your message! We'll get back to you soon.",
      id: contactMessage._id,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
