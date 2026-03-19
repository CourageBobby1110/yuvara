import Image from "next/image";
import Link from "next/link";
import { Download, Smartphone, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "Download Yuvara App | Luxury Shopping at Your Fingertips",
  description: "Experience the ultimate luxury shopping experience with the Yuvara mobile app. Download now for exclusive access and faster checkout.",
};

export default function DownloadPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg-secondary)", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "4rem", 
          alignItems: "center",
          "@media (max-width: 768px)": { gridTemplateColumns: "1fr" } 
        } as any}>
          
          {/* Left: Content */}
          <div>
            <span style={{ 
              color: "var(--color-luxury-gold)", 
              fontWeight: "600", 
              textTransform: "uppercase", 
              letterSpacing: "0.1em",
              fontSize: "0.875rem"
            }}>
              Now Available on Android
            </span>
            <h1 style={{ 
              fontSize: "3.5rem", 
              marginTop: "1rem", 
              marginBottom: "1.5rem",
              lineHeight: "1.1" 
            }}>
              Luxury Shopping, <br />
              <span style={{ color: "var(--color-luxury-gold)" }}>Redefined</span>
            </h1>
            <p style={{ fontSize: "1.125rem", color: "var(--color-text-secondary)", marginBottom: "2.5rem" }}>
              Take the Yuvara experience with you wherever you go. Our new Android app brings 
              exclusive collections, lightning-fast checkout, and personalized updates directly to your pocket.
            </p>
            
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/yuvara.apk" className="btn-primary" style={{ gap: "0.5rem", padding: "1rem 2rem" }}>
                <Download size={20} />
                Download APK
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                <ShieldCheck size={16} />
                Verified & Secure
              </div>
            </div>
            
            <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ color: "var(--color-luxury-gold)" }}><Zap size={24} /></div>
                <div>
                  <h4 style={{ marginBottom: "0.25rem" }}>Faster Access</h4>
                  <p style={{ fontSize: "0.875rem" }}>Optimized performance for a seamless browse.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ color: "var(--color-luxury-gold)" }}><Smartphone size={24} /></div>
                <div>
                  <h4 style={{ marginBottom: "0.25rem" }}>Mobile Exclusive</h4>
                  <p style={{ fontSize: "0.875rem" }}>Get access to app-only deals and drops.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Mockup Image */}
          <div style={{ position: "relative", textAlign: "center" }}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "120%",
              height: "120%",
              background: "radial-gradient(circle, rgba(153, 101, 21, 0.1) 0%, transparent 70%)",
              zIndex: 0
            }}></div>
            <Image 
              src="/images/app-mockup.png" 
              alt="Yuvara App Mockup" 
              width={500} 
              height={800} 
              priority
              style={{ position: "relative", zIndex: 1, objectFit: "contain", maxWidth: "100%", height: "auto" }}
            />
          </div>
        </div>
      </section>

      {/* Installation Guide Section */}
      <section style={{ backgroundColor: "var(--color-bg-primary)", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="glass-panel" style={{ padding: "3rem", borderRadius: "1rem" }}>
            <h2 style={{ textAlign: "center", marginBottom: "3rem" }}>How to install</h2>
            <div style={{ display: "grid", gap: "2rem" }}>
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                <div style={{ 
                  backgroundColor: "var(--color-primary)", 
                  color: "white", 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexShrink: 0,
                  fontWeight: "bold"
                }}>1</div>
                <div>
                  <h4 style={{ marginBottom: "0.5rem" }}>Download the APK</h4>
                  <p>Click the download button above to save the `yuvara.apk` file to your device.</p>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                <div style={{ 
                  backgroundColor: "var(--color-primary)", 
                  color: "white", 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexShrink: 0,
                  fontWeight: "bold"
                }}>2</div>
                <div>
                  <h4 style={{ marginBottom: "0.5rem" }}>Enable Unknown Sources</h4>
                  <p>Open your device **Settings** &gt; **Apps** &gt; **Special App Access** &gt; **Install Unknown Apps**. Select your browser and toggle **"Allow from this source"**.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                <div style={{ 
                  backgroundColor: "var(--color-primary)", 
                  color: "white", 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexShrink: 0,
                  fontWeight: "bold"
                }}>3</div>
                <div>
                  <h4 style={{ marginBottom: "0.5rem" }}>Install & Enjoy</h4>
                  <p>Open the downloaded file and tap **Install**. Once finished, you can launch the Yuvara app from your home screen.</p>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: "3rem", textAlign: "center", borderTop: "1px solid var(--color-border-light)", paddingTop: "2rem" }}>
              <p style={{ fontSize: "0.875rem", fontStyle: "italic" }}>
                Note: This is an official Yuvara release. Always ensure you download from our official website.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer-like CTA */}
      <section style={{ backgroundColor: "var(--color-primary)", padding: "4rem 1.5rem", color: "white", textAlign: "center" }}>
        <h2 style={{ color: "white", marginBottom: "1rem" }}>Ready to elevate your experience?</h2>
        <p style={{ color: "var(--color-text-light)", marginBottom: "2rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
          Join thousands of luxury shoppers who prefer the Yuvara mobile experience.
        </p>
        <Link href="/yuvara.apk" className="btn-primary" style={{ backgroundColor: "var(--color-luxury-gold)", color: "white" }}>
          Get APK Now
        </Link>
      </section>
    </div>
  );
}
