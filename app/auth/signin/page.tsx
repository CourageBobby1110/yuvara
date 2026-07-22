import Link from "next/link";
import Image from "next/image";
import SignInForm from "./SignInForm";
import GoogleSignInButton from "./GoogleSignInButton";
import styles from "./SignIn.module.css";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

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
  const registered = resolvedSearchParams.registered === "true";

  // Clear any leftover session to ensure clean sign-in
  const session = await auth();
  const forceClear = resolvedSearchParams._sc === "1";
  if (session?.user && !forceClear) {
    await signOut();
    redirect("/auth/signin?_sc=1");
  }

  return (
    <div className={styles.container}>
      {/* Left Side - Image */}
      <div className={styles.imageSection}>
        <Image
          src="/auth-image.png"
          alt="Premium Shopping"
          fill
          className={styles.authImage}
          priority
        />
        <div className={styles.imageOverlay}>
          <div className={styles.imageText}>
            <h1 className={styles.imageHeading}>Elevate Your Style.</h1>
            <p className={styles.imageSubtext}>
              Join our exclusive community and discover curated collections
              defining modern luxury.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className={styles.formSection}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.title}>
              <Link
                href="/"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  display: "block",
                }}
              >
                <Image
                  src="/icon.png"
                  alt="Yuvara"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </Link>
            </div>
            <p className={styles.subtitle}>Welcome Back</p>
            <p className={styles.description}>
              Please enter your details to sign in.
            </p>
          </div>

          {registered && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center text-sm" role="alert">
              Account created! We've sent a verification link to your email. Please verify your email before signing in.
            </div>
          )}

          <SignInForm callbackUrl={callbackUrl} />

          <div className={styles.divider}>
            <div className={styles.dividerContent}>
              <div className={styles.line}></div>
              <span className={styles.dividerText}>Or continue with</span>
              <div className={styles.line}></div>
            </div>
          </div>

          <GoogleSignInButton callbackUrl={callbackUrl} />

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Don't have an account?{" "}
              <Link
                href={`/auth/signup?callbackUrl=${encodeURIComponent(
                  callbackUrl,
                )}`}
                className={styles.link}
              >
                Sign up
              </Link>
            </p>
            <Link href="/" className={styles.returnLink}>
              Return to Store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
