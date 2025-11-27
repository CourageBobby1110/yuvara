import { auth } from "@/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import AffiliateClient from "./AffiliateClient";

import Withdrawal from "@/models/Withdrawal";

export default async function AffiliateDashboard() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin?callbackUrl=/dashboard/affiliate");
  }

  await dbConnect();
  const user: any = await User.findById(session.user.id).lean();

  if (!user) {
    redirect("/auth/signin");
  }

  const withdrawals = await Withdrawal.find({ user: user._id })
    .sort({ createdAt: -1 })
    .lean();

  // Serialize data to pass to client component
  const affiliateData = {
    isAffiliate: user.isAffiliate || false,
    affiliateBalance: user.affiliateBalance || 0,
    totalEarnings: user.totalEarnings || 0,
    referralCode: user.referralCode || "",
    referralCount: user.referralCount || 0,
    affiliateBankDetails: user.affiliateBankDetails,
    userName: user.name,
    withdrawals: JSON.parse(JSON.stringify(withdrawals)),
  };

  return <AffiliateClient initialData={affiliateData} />;
}
