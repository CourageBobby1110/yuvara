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
                  src="/logo.png"
                  alt="Yuvara"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              </Link>
            </div>
            <p className={styles.subtitle}>Welcome Back</p>
            <p className={styles.description}>
              Please enter your details to sign in.
            </p>
          </div>

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
              await signIn("nodemailer", {
                email: "user@example.com",
                redirectTo: callbackUrl,
              });
            }}
          >
            <button disabled className={styles.magicLinkButton}>
              Magic Link (Coming Soon)
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
