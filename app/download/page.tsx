import Image from "next/image";
import Link from "next/link";
import { Download, Smartphone, ShieldCheck, Zap, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Download Yuvara App | Luxury Shopping",
  description: "Get the Yuvara Android app for a premium shopping experience with exclusive access and faster checkout.",
};

export default function DownloadPage() {
  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", color: "#111827" }}>
      {/* Hero Section */}
      <section style={{ position: "relative", padding: "6rem 1.5rem", maxWidth: "1200px", margin: "0 auto", overflow: "hidden" }}>
        <div style={{ 
          display: "flex", 
          flexDirection: "row",
          gap: "4rem", 
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap"
        }}>
          
          {/* Left Content */}
          <div style={{ flex: "1 1 500px" }}>
            <div style={{ 
              display: "inline-block",
              padding: "0.5rem 1rem",
              backgroundColor: "rgba(153, 101, 21, 0.1)",
              borderRadius: "2rem",
              color: "#996515",
              fontWeight: "700",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: "1.5rem"
            }}>
              Now Available for Android
            </div>
            
            <h1 style={{ 
              fontSize: "clamp(2.5rem, 5vw, 4rem)", 
              fontWeight: "800",
              lineHeight: "1.05",
              marginBottom: "1.5rem",
              color: "#000000"
            }}>
              Your Gateway to <br />
              <span style={{ 
                backgroundImage: "linear-gradient(45deg, #996515, #b8860b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Global Luxury</span>
            </h1>
            
            <p style={{ 
              fontSize: "1.25rem", 
              lineHeight: "1.6", 
              color: "#4b5563", 
              marginBottom: "3rem",
              maxWidth: "550px"
            }}>
              Elevate your shopping journey. The Yuvara app brings curated collections, 
              faster checkout, and early access to drops directly to your mobile device.
            </p>
            
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <Link 
                href="/yuvara.apk" 
                style={{ 
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  backgroundColor: "#000000", 
                  color: "#ffffff", 
                  padding: "1.25rem 2.5rem",
                  borderRadius: "0.5rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  transition: "all 0.3s ease",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                  border: "1px solid #996515"
                }}
              >
                <Download size={20} />
                Download App
              </Link>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "0.9rem" }}>
                <ShieldCheck size={18} color="#10b981" />
                <span>Official APK • 16.3MB</span>
              </div>
            </div>
          </div>

          {/* Right Mockup */}
          <div style={{ flex: "1 1 400px", position: "relative", display: "flex", justifyContent: "center" }}>
            <div style={{
              position: "absolute",
              width: "140%",
              height: "140%",
              top: "-20%",
              left: "-20%",
              background: "radial-gradient(circle, rgba(153, 101, 21, 0.08) 0%, transparent 70%)",
              zIndex: 0
            }}></div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <Image 
                src="/images/app-mockup-flagship.png" 
                alt="Yuvara App" 
                width={450} 
                height={750} 
                priority
                style={{ filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.15))", maxWidth: "100%", height: "auto" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ backgroundColor: "#f9fafb", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          {[
            { icon: <Zap size={24} />, title: "Instant Access", desc: "Browse thousands of products with zero lag and optimized mobile performance." },
            { icon: <Smartphone size={24} />, title: "App Exclusives", desc: "Enjoy early access to new arrivals and app-only promotional offers." },
            { icon: <ArrowRight size={24} />, title: "Track Anywhere", desc: "Real-time updates on your orders and shipping directly via notifications." }
          ].map((feature, i) => (
            <div key={i} style={{ backgroundColor: "#ffffff", padding: "2.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb" }}>
              <div style={{ color: "#996515", marginBottom: "1.25rem" }}>{feature.icon}</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem" }}>{feature.title}</h3>
              <p style={{ color: "#4b5563", lineHeight: "1.6" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Installation Guide */}
      <section style={{ padding: "6rem 1.5rem", maxWidth: "900px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "2.25rem", fontWeight: "800", marginBottom: "4rem" }}>Easy Installation</h2>
        
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {[
            { step: 1, title: "Download", text: "Tap the download button above to get the APK file." },
            { step: 2, title: "Settings", text: "Enable 'Install Unknown Apps' in your browser settings if prompted." },
            { step: 3, title: "Install", text: "Open the file and tap 'Install' to add Yuvara to your home screen." }
          ].map((item, i) => (
            <div key={i} style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "2rem", 
              padding: "2rem",
              backgroundColor: "#ffffff",
              borderRadius: "1rem",
              border: "1px solid #e5e7eb",
              transition: "transform 0.2s ease"
            }}>
              <div style={{ 
                fontSize: "2.5rem", 
                fontWeight: "900", 
                color: "rgba(153, 101, 21, 0.2)",
                fontFamily: "serif"
              }}>0{item.step}</div>
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.title}</h4>
                <p style={{ color: "#4b5563" }}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{ backgroundColor: "#000000", padding: "6rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ 
          position: "absolute", 
          top: "0", 
          left: "0", 
          width: "100%", 
          height: "100%", 
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(153, 101, 21, 0.15) 0%, transparent 60%)",
          zIndex: 0
        }}></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ color: "#ffffff", fontSize: "2.5rem", fontWeight: "800", marginBottom: "1.5rem" }}>Ready to Shop Better?</h2>
          <p style={{ color: "#9ca3af", marginBottom: "3rem", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 3rem" }}>
            Join our global community of shoppers today.
          </p>
          <Link 
            href="/yuvara.apk" 
            style={{ 
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              backgroundColor: "#996515", 
              color: "#ffffff", 
              padding: "1.25rem 3rem",
              borderRadius: "0.5rem",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              transition: "transform 0.2s ease",
              boxShadow: "0 10px 30px rgba(153, 101, 21, 0.3)"
            }}
          >
            <Download size={20} />
            Install Now
          </Link>
        </div>
      </section>
    </div>
  );
}
