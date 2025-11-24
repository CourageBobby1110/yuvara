"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface ReferralData {
  referralCode: string;
  referralCount: number;
  coupons: any[];
  referredUsers: any[];
}

export default function ReferralDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/user/referrals");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      alert("Referral code copied!");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return <div className="p-8 text-center">Failed to load data.</div>;

  const progress = Math.min(100, (data.referralCount / 20) * 100);
  const remaining = Math.max(0, 20 - data.referralCount);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black mb-4">Invite Friends & Earn Rewards</h1>
          <p className="text-gray-500 text-lg">
            Refer 20 friends and get a FREE product (up to ₦5,000)!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Stats Card */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Your Progress</h2>
            
            <div className="mb-8">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">{data.referralCount} Referrals</span>
                <span className="text-gray-500">Goal: 20</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-black h-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {remaining > 0 
                  ? `Just ${remaining} more referrals to unlock your reward!` 
                  : "Congratulations! You've unlocked a reward!"}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Your Referral Code</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl font-mono font-bold tracking-wider">{data.referralCode || "Generating..."}</span>
                <button 
                  onClick={copyToClipboard}
                  className="text-gray-400 hover:text-black transition-colors"
                  title="Copy Code"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Rewards Card */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Your Rewards</h2>
            
            {data.coupons.length > 0 ? (
              <div className="space-y-4">
                {data.coupons.map((coupon) => (
                  <div key={coupon._id} className={`p-4 rounded-xl border ${coupon.isUsed ? "bg-gray-50 border-gray-200 opacity-60" : "bg-green-50 border-green-200"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono font-bold text-lg">{coupon.code}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${coupon.isUsed ? "bg-gray-200 text-gray-600" : "bg-green-200 text-green-800"}`}>
                        {coupon.isUsed ? "REDEEMED" : "ACTIVE"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {coupon.isUsed 
                        ? `Used on ${new Date(coupon.usedAt).toLocaleDateString()}` 
                        : "Use this code at checkout for a free item!"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400">
                <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <p>No rewards earned yet.</p>
                <p className="text-sm">Start inviting friends to earn!</p>
              </div>
            )}
          </div>
        </div>

        {/* Referred Users List */}
        <div className="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Referred Friends ({data.referredUsers?.length || 0})</h2>
          
          {data.referredUsers && data.referredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                    <th className="pb-4 font-medium">User</th>
                    <th className="pb-4 font-medium">Joined Date</th>
                    <th className="pb-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.referredUsers.map((user: any) => (
                    <tr key={user._id} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                            {user.name?.[0] || "U"}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Registered
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No referrals yet. Share your code to get started!</p>
          )}
        </div>
      </div>
    </div>
  );
}
