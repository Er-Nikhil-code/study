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
          background: "linear-gradient(to bottom right, #ef4444, #e11d48)",
          borderRadius: "40px",
          color: "white",
          fontSize: "130px",
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
