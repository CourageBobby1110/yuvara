import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import SiteSettings from "@/models/SiteSettings";
import dbConnect from "@/lib/db";
import { Rocket, Infinity as InfinityIcon, Percent, UserPlus, Share2, Coins } from "lucide-react";

export const metadata = {
  title: "Affiliate Program | Yuvara",
  description:
    "Join the Yuvara Affiliate Program and earn commissions by referring friends and followers.",
};

async function getAffiliateStatus() {
  await dbConnect();
  const settings = await SiteSettings.findOne().lean();
  return settings?.affiliateProgramStatus || "open";
}

export default async function AffiliateProgramPage() {
  const session = await auth();
  const status = await getAffiliateStatus();
  
  await dbConnect();
  const settings = await SiteSettings.findOne().lean();
  const heroImage = settings?.heroImageUrl || "/hero-shoe-minimalist.png";

  if (status === "postponed") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Coming Soon</h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Our affiliate program is currently being updated to bring you better
            rewards and a smoother experience. Stay tuned!
          </p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-8 py-4 text-lg font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (status === "closed") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Program Closed
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            The Yuvara Affiliate Program is currently closed for new
            registrations. Please check back later.
          </p>
          <Link
            href="/"
            className="inline-block bg-black text-white px-8 py-4 text-lg font-bold rounded-full hover:bg-gray-800 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-primary">
      {/* Hero Section */}
      <section className="relative py-20 bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src={heroImage}
            alt="Background"
            fill
            className="object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 !text-white" style={{ textShadow: "0px 4px 20px rgba(0,0,0,0.9)" }}>
            Partner with Yuvara
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 !text-white" style={{ textShadow: "0px 4px 15px rgba(0,0,0,0.9)" }}>
            Join our exclusive affiliate program and earn 10% commission on
            every sale you refer.
          </p>
          <Link
            href={
              session
                ? "/dashboard/affiliate"
                : "/auth/signup?callbackUrl=/dashboard/affiliate"
            }
            className="inline-block bg-white text-black px-8 py-4 text-lg font-bold rounded-full hover:bg-gray-200 transition-colors shadow-lg"
          >
            {session ? "Go to Dashboard" : "Join Now"}
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-primary">Why Join?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center p-6 card rounded-xl">
              <div className="w-16 h-16 bg-primary text-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-current">
                <Percent className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-primary">High Commission</h3>
              <p className="text-secondary">
                Earn a competitive 10% commission on every successful purchase
                made through your unique link.
              </p>
            </div>
            <div className="text-center p-6 card rounded-xl">
              <div className="w-16 h-16 bg-primary text-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-current">
                <InfinityIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-primary">Unlimited Earnings</h3>
              <p className="text-secondary">
                There's no cap on how much you can earn. The more you share, the
                more you make.
              </p>
            </div>
            <div className="text-center p-6 card rounded-xl">
              <div className="w-16 h-16 bg-primary text-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-current">
                <Rocket className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-primary">Easy Payouts</h3>
              <p className="text-secondary">
                Get paid directly to your bank account. Simple, fast, and
                transparent tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-tertiary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16 text-primary">How It Works</h2>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center mb-12 p-6 glass-panel rounded-2xl">
              <div className="w-12 h-12 bg-primary text-primary border border-current rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-primary">Sign Up</h3>
                <p className="text-secondary">
                  Create a Yuvara account and activate your affiliate dashboard
                  in seconds.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center mb-12 p-6 glass-panel rounded-2xl">
              <div className="w-12 h-12 bg-primary text-primary border border-current rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-primary">Share Your Link</h3>
                <p className="text-secondary">
                  Get your unique referral link and share it on social media,
                  your blog, or with friends.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center p-6 glass-panel rounded-2xl">
              <div className="w-12 h-12 bg-primary text-primary border border-current rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-primary">Earn Cash</h3>
                <p className="text-secondary">
                  Track your clicks and conversions in real-time and withdraw
                  your earnings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center bg-primary">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 text-primary">Ready to start earning?</h2>
          <Link
            href={
              session
                ? "/dashboard/affiliate"
                : "/auth/signup?callbackUrl=/dashboard/affiliate"
            }
            className="btn-primary rounded-full px-10 py-4 text-lg !text-white"
          >
            Join the Program
          </Link>
        </div>
      </section>
    </div>
  );
}
