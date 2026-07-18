import Image from "next/image";
import Link from "next/link";
import { Download, Smartphone, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import styles from "./Download.module.css";

export const metadata = {
  title: "Download Yuvara App | Luxury Shopping",
  description: "Get the Yuvara Android app for a premium shopping experience with exclusive access and faster checkout.",
};

export default function DownloadPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          
          {/* Left Content */}
          <div className={styles.leftContent}>
            <div className={styles.androidBadge}>
              Now Available for Android
            </div>
            
            <h1 className={styles.mainTitle}>
              Your Gateway to <br />
              <span className={styles.gradientText}>Global Luxury</span>
            </h1>
            
            <p className={styles.description}>
              Elevate your shopping journey. The Yuvara app brings curated collections, 
              faster checkout, and early access to drops directly to your mobile device.
            </p>
            
            <div className={styles.ctaGroup}>
              <Link href="/yuvara.apk" className={styles.downloadBtn}>
                <Download size={20} />
                Download App
              </Link>
              
              <div className={styles.btnMeta}>
                <ShieldCheck size={18} color="#10b981" />
                <span>Official APK • 16.3MB</span>
              </div>
            </div>
          </div>

          {/* Right Mockup */}
          <div className={styles.rightMockup}>
            <div className={styles.glowBackground}></div>
            <Image 
              src="/images/app-mockup-flagship.png" 
              alt="Yuvara App" 
              width={450} 
              height={750} 
              priority
              className={styles.mockupImage}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.featuresSection}>
        <div className={styles.featuresGrid}>
          {[
            { icon: <Zap size={24} />, title: "Instant Access", desc: "Browse thousands of products with zero lag and optimized mobile performance." },
            { icon: <Smartphone size={24} />, title: "App Exclusives", desc: "Enjoy early access to new arrivals and app-only promotional offers." },
            { icon: <ArrowRight size={24} />, title: "Track Anywhere", desc: "Real-time updates on your orders and shipping directly via notifications." }
          ].map((feature, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Installation Guide */}
      <section className={styles.guideSection}>
        <h2 className={styles.guideTitle}>Easy Installation</h2>
        
        <div className={styles.guideGrid}>
          {[
            { step: 1, title: "Download", text: "Tap the download button above to get the APK file." },
            { step: 2, title: "Settings", text: "Enable 'Install Unknown Apps' in your browser settings if prompted." },
            { step: 3, title: "Install", text: "Open the file and tap 'Install' to add Yuvara to your home screen." }
          ].map((item, i) => (
            <div key={i} className={styles.guideCard}>
              <div className={styles.guideStep}>0{item.step}</div>
              <div>
                <h4 className={styles.guideStepTitle}>{item.title}</h4>
                <p className={styles.guideStepText}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBgGlow}></div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Shop Better?</h2>
          <p className={styles.ctaSubtitle}>
            Join our global community of shoppers today.
          </p>
          <Link href="/yuvara.apk" className={styles.installNowBtn}>
            <Download size={20} />
            Install Now
          </Link>
        </div>
      </section>
    </div>
  );
}
