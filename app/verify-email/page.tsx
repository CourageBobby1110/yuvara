import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import ResendVerificationButton from "./ResendVerificationButton";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Token from "@/models/Token";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params?.token;

  if (token) {
    let success = false;
    let errorMsg = "";

    try {
      await dbConnect();
      const tokenDoc = await Token.findOne({ token });

      if (!tokenDoc) {
        errorMsg = "Invalid or expired verification link.";
      } else {
        const user = await User.findById(tokenDoc.userId);
        if (!user) {
          errorMsg = "User not found.";
        } else {
          user.emailVerified = new Date();
          await user.save();
          await Token.deleteOne({ _id: tokenDoc._id });
          success = true;
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      errorMsg = "An error occurred during verification.";
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
          {success ? (
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been verified successfully. You can now log in to your account.
              </p>
              <div className="mt-8">
                <Link
                  href="/auth/signin"
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none"
                >
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Verification Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {errorMsg || "The verification link is invalid or has expired."}
              </p>
              <div className="mt-8">
                <Link
                  href="/auth/signin"
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  // If already verified, redirect home (middleware handles this too, but good as backup)
  if ((session.user as any).emailVerified) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to{" "}
            <strong>{session.user?.email}</strong>.
            <br />
            Please check your inbox and click the link to verify your account.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You must verify your email to access the dashboard and other
                  features.
                </p>
              </div>
            </div>
          </div>

          <ResendVerificationButton email={session.user?.email || ""} />

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
