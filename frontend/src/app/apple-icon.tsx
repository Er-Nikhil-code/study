import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          border: "2px solid rgba(255,255,255,0.2)",
          borderRadius: "40px",
          color: "#dc2626",
          fontSize: "120px",
          fontWeight: "900",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "inset 0 2px 2px rgba(255,255,255,0.1), 0 8px 20px rgba(0,0,0,0.5)",
          position: "relative",
        }}
      >
        C
        <span style={{ position: "absolute", bottom: "4px", right: "-12px", fontSize: "32px", color: "#ef4444", transform: "rotate(-12deg)", fontFamily: "cursive", textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>today</span>
      </div>
    ),
    { ...size }
  );
}
