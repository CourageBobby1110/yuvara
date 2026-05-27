import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function POST(req: Request) {
  return NextResponse.json(
    { error: "Bulk deletion is no longer permitted for security reasons." },
    { status: 403 }
  );
}
