import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Subscriber from "@/models/Subscriber";
import { sendNewsletter } from "@/lib/mail";
import { marked } from "marked";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { subject, markdownBody } = await req.json();

    if (!subject || !markdownBody) {
      return NextResponse.json(
        { message: "Subject and body are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const subscribers = await Subscriber.find().select("email");

    if (subscribers.length === 0) {
      return NextResponse.json(
        { message: "No subscribers found" },
        { status: 400 }
      );
    }

    const recipientEmails = subscribers.map((s) => s.email);

    // Convert markdown to HTML
    // marked returns a string or Promise<string>, we await it just in case
    const htmlContent = await marked.parse(markdownBody);

    await sendNewsletter(subject, htmlContent, markdownBody, recipientEmails);

    return NextResponse.json({
      message: `Newsletter sent to ${recipientEmails.length} subscribers`,
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
