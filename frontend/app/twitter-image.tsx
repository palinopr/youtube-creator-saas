import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "TubeGrow - AI-Powered YouTube Analytics";
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
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(249, 115, 22, 0.15) 0%, transparent 50%)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {/* TrendingUp Icon */}
          <div
            style={{
              display: "flex",
              width: "64px",
              height: "64px",
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              borderRadius: "16px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>

          {/* Brand Name */}
          <div style={{ display: "flex" }}>
            <span
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              Tube
            </span>
            <span
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                background: "linear-gradient(to right, #ef4444, #f97316)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Grow
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "32px",
            color: "#9ca3af",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          AI-Powered YouTube Analytics & Growth Tools
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span style={{ fontSize: "20px", color: "#ef4444" }}>Analytics</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span style={{ fontSize: "20px", color: "#a855f7" }}>Growth</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span style={{ fontSize: "20px", color: "#ec4899" }}>Clips</span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "24px",
            color: "#6b7280",
          }}
        >
          tubegrow.io
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
