import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, email } = body;

    if (!amount || !email) {
      return NextResponse.json({ error: "Missing amount or email" }, { status: 400 });
    }

    const params = {
      email,
      amount: Math.round(amount * 100), // Paystack expects amount in kobo
      callback_url: `${process.env.NEXTAUTH_URL}/checkout/callback`,
      metadata: {
        userId: session.user.email, // Using email as ID for now since we might not have DB ID in session
      },
    };

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }

    return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference });
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
