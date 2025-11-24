import { signIn } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import SignInForm from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl =
    typeof resolvedSearchParams.callbackUrl === "string"
      ? resolvedSearchParams.callbackUrl
      : "/";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      {/* Background Elements - Darker and more subtle */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-shoe.png"
          alt="Background"
          fill
          className="object-cover opacity-10 scale-110 blur-md grayscale"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black" />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        {/* Matte Ceramic Container */}
        <div className="bg-[#111] p-10 border border-zinc-800 shadow-2xl rounded-2xl animate-fade-in-up relative overflow-hidden">
          {/* Subtle top highlight for ceramic feel */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50" />

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              YUVARA
            </h1>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-medium">
              Member Access
            </p>
          </div>

          <SignInForm callbackUrl={callbackUrl} />

          <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px bg-zinc-800 flex-1"></div>
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
                Or continue with
              </span>
              <div className="h-px bg-zinc-800 flex-1"></div>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("nodemailer", {
                  email: "user@example.com",
                  redirectTo: callbackUrl,
                });
              }}
            >
              <button
                disabled
                className="w-full py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-sm font-medium hover:bg-zinc-800 transition-all cursor-not-allowed"
              >
                Magic Link (Coming Soon)
              </button>
            </form>
          </div>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-zinc-500">
              New to Yuvara?{" "}
              <Link
                href={`/auth/signup?callbackUrl=${encodeURIComponent(
                  callbackUrl
                )}`}
                className="text-white font-medium hover:text-zinc-300 transition-colors"
              >
                Create Account
              </Link>
            </p>
            <Link
              href="/"
              className="inline-block text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
