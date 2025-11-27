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
      {/* Background Elements - Light and subtle */}
      <div className={styles.backgroundWrapper}>
        <Image
          src="/images/auth-bg.jpg"
          alt="Background"
          fill
          className={styles.backgroundImage}
          priority
        />
        <div className={styles.backgroundOverlay} />
      </div>

      <div className={styles.contentWrapper}>
        {/* Clean Light Container */}
        <div className={styles.card}>
          {/* Subtle top highlight */}
          <div className={styles.cardHighlight} />

          <div className={styles.header}>
            <div className={styles.title}>
              <Image
                src="/logo.png"
                alt="Yuvara"
                width={180}
                height={60}
                style={{ objectFit: "contain" }}
              />
            </div>
            <p className={styles.subtitle}>Member Access</p>
          </div>

          <SignInForm callbackUrl={callbackUrl} />

          <div className={styles.divider}>
            <div className={styles.dividerContent}>
              <div className={styles.line}></div>
              <span className={styles.dividerText}>Or continue with</span>
              <div className={styles.line}></div>
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
          </div>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              New to Yuvara?{" "}
              <Link
                href={`/auth/signup?callbackUrl=${encodeURIComponent(
                  callbackUrl
                )}`}
                className={styles.link}
              >
                Create Account
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
