import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";

export const metadata = {
  title: "Affiliate Program | Yuvara",
  description:
    "Join the Yuvara Affiliate Program and earn commissions by referring friends and followers.",
};

export default async function AffiliateProgramPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/hero-shoe-minimalist.png" // Reusing existing asset
            alt="Background"
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Partner with Yuvara
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10">
            Join our exclusive affiliate program and earn 10% commission on
            every sale you refer.
          </p>
          <Link
            href={
              session
                ? "/dashboard/affiliate"
                : "/auth/signup?callbackUrl=/dashboard/affiliate"
            }
            className="inline-block bg-white text-black px-8 py-4 text-lg font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            {session ? "Go to Dashboard" : "Join Now"}
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Why Join?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                10%
              </div>
              <h3 className="text-xl font-bold mb-4">High Commission</h3>
              <p className="text-gray-600">
                Earn a competitive 10% commission on every successful purchase
                made through your unique link.
              </p>
            </div>
            <div className="text-center p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                ∞
              </div>
              <h3 className="text-xl font-bold mb-4">Unlimited Earnings</h3>
              <p className="text-gray-600">
                There's no cap on how much you can earn. The more you share, the
                more you make.
              </p>
            </div>
            <div className="text-center p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                🚀
              </div>
              <h3 className="text-xl font-bold mb-4">Easy Payouts</h3>
              <p className="text-gray-600">
                Get paid directly to your bank account. Simple, fast, and
                transparent tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center mb-12">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Sign Up</h3>
                <p className="text-gray-600">
                  Create a Yuvara account and activate your affiliate dashboard
                  in seconds.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center mb-12">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Share Your Link</h3>
                <p className="text-gray-600">
                  Get your unique referral link and share it on social media,
                  your blog, or with friends.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Earn Cash</h3>
                <p className="text-gray-600">
                  Track your clicks and conversions in real-time and withdraw
                  your earnings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to start earning?</h2>
          <Link
            href={
              session
                ? "/dashboard/affiliate"
                : "/auth/signup?callbackUrl=/dashboard/affiliate"
            }
            className="inline-block bg-black text-white px-10 py-4 text-lg font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Join the Program
          </Link>
        </div>
      </section>
    </div>
  );
}
