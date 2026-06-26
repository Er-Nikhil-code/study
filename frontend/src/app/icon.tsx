import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 48, height: 48 };
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
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "12px",
          color: "#dc2626",
          fontSize: "36px",
          fontWeight: "900",
          fontFamily: "system-ui, -apple-system, sans-serif",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 10px rgba(0,0,0,0.5)",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
