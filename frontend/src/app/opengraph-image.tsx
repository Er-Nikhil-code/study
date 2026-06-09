import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CODIFY";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom right, #ef4444, #e11d48)",
          color: "white",
          fontSize: "650px",
          fontWeight: "900",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
