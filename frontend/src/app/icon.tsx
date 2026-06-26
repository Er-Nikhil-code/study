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
          background: "transparent",
          color: "#ef4444",
          fontSize: "40px",
          fontWeight: "900",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        c
      </div>
    ),
    { ...size }
  );
}
