import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Withdrawal from "@/models/Withdrawal";
import WithdrawalsClient from "./WithdrawalsClient";
import User from "@/models/User"; // Ensure User model is registered

export default async function WithdrawalsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  // In a real app, check for admin role here
  // if (session.user.role !== "admin") redirect("/");

  await dbConnect();

  // Ensure User model is registered before populating
  // This is sometimes needed in dev mode with HMR
  const _ = User;

  const withdrawals = await Withdrawal.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <WithdrawalsClient withdrawals={JSON.parse(JSON.stringify(withdrawals))} />
  );
}
