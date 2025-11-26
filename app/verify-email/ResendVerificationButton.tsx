"use client";

import { useState } from "react";
import { sendVerificationEmail } from "@/app/actions/sendVerificationEmail";

export default function ResendVerificationButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setMessage("");

    const result = await sendVerificationEmail(email);

    if (result.success) {
      setMessage("Verification email sent! Check your inbox.");
    } else {
      setMessage("Failed to send email. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleResend}
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Resend verification email"}
      </button>
      {message && (
        <p
          className={`mt-2 text-sm ${
            message.includes("Failed") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
