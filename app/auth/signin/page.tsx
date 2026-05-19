import { signIn } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import SignInForm from "./SignInForm";
import styles from "./SignIn.module.css";

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

          <form
            action={async () => {
              "use server";
              await signIn("google", {
                redirectTo: callbackUrl,
              });
            }}
          >
            <button type="submit" className={styles.googleButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </form>

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
