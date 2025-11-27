"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // Store referral code in a cookie for 30 days
      const d = new Date();
      d.setTime(d.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expires = "expires=" + d.toUTCString();
      document.cookie = `referralCode=${ref};${expires};path=/`;
    }
  }, [searchParams]);

  return null;
}
