import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import ResendVerificationButton from "./ResendVerificationButton";

export default async function VerifyEmailPage() {
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
