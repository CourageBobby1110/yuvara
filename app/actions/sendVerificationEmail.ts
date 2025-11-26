"use server";

export async function sendVerificationEmail(email: string) {
  try {
    // Call NextAuth's signin endpoint with email provider
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/auth/signin/nodemailer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email,
          callbackUrl: "/",
          json: "true",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send email");
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}
