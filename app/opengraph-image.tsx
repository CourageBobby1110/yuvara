import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Yuvara - Global Online Shopping";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "180px",
            height: "180px",
            borderRadius: "40px",
            background: "#111827",
            color: "#ffffff",
            fontSize: "100px",
            fontWeight: "bold",
            marginBottom: "30px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          }}
        >
          Y
        </div>
        <div
          style={{
            fontSize: "80px",
            fontWeight: "bold",
            color: "#111827",
            letterSpacing: "-0.03em",
            marginBottom: "10px",
          }}
        >
          Yuvara
        </div>
        <div
          style={{
            fontSize: "32px",
            color: "#6b7280",
            fontWeight: "500",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Global Online Shopping
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
