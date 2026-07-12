import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const alt = "Yuvara - Premium Global Online Shopping";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    join(process.cwd(), "public", "icon.png")
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <img
          src={logoBase64}
          alt="Yuvara"
          width={400}
          height={400}
          style={{
            objectFit: "contain",
            marginBottom: "20px",
          }}
        />
        <div
          style={{
            fontSize: "28px",
            color: "#c9a96e",
            fontWeight: "500",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Premium Global Online Shopping
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
