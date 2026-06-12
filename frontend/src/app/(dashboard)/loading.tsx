/**
 * Premium full-page loading screen for CODIFY.
 *
 * Design:
 *  - Deep dark background matching the app's radial-red ambiance
 *  - Central glowing "C" orb — the brand mark — morphing & breathing
 *  - Two concentric counter-rotating dashed rings
 *  - Five orbiting particle dots (3 outer, 2 inner reversed)
 *  - Animated progress bar at the bottom
 *  - Subtle wordmark fade-in below the orb
 */
export default function Loading() {
  return (
    <div
      style={{
        minHeight: "50vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Ambient background glow ── */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Orb + ring system ── */}
      <div style={{ position: "relative", width: 120, height: 120 }}>

        {/* Outer dashed ring (clockwise) */}
        <div
          className="loader-ring"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px dashed rgba(220,38,38,0.35)",
          }}
        />

        {/* Middle dashed ring (counter-clockwise, slightly smaller) */}
        <div
          className="loader-ring-rev"
          style={{
            position: "absolute",
            inset: 12,
            borderRadius: "50%",
            border: "1px dashed rgba(220,38,38,0.22)",
          }}
        />

        {/* Orbiting dots — outer ring (3 dots, 120° apart) */}
        {[
          { cls: "loader-dot-a", color: "#ef4444" },
          { cls: "loader-dot-b", color: "#f87171" },
          { cls: "loader-dot-c", color: "#fca5a5" },
        ].map(({ cls, color }) => (
          <div
            key={cls}
            className={cls}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: -3,
              marginLeft: -3,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: color,
              boxShadow: `0 0 8px 2px ${color}80`,
            }}
          />
        ))}

        {/* Orbiting dots — inner ring (2 dots, reversed) */}
        {[
          { cls: "loader-dot-d", color: "rgba(220,38,38,0.7)" },
          { cls: "loader-dot-e", color: "rgba(220,38,38,0.45)" },
        ].map(({ cls, color }) => (
          <div
            key={cls}
            className={cls}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: -2.5,
              marginLeft: -2.5,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: color,
            }}
          />
        ))}

        {/* Central glowing "C" orb */}
        <div
          className="loader-orb loader-glow"
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 38% 35%, #ef4444 0%, #b91c1c 55%, #7f1d1d 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily:
                "'SF Pro Display', 'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 28,
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: "-0.04em",
              userSelect: "none",
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
            }}
          >
            C
          </span>
        </div>
      </div>

      {/* ── Wordmark ── */}
      <div
        className="loader-text"
        style={{
          marginTop: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          animationDelay: "0.3s",
          opacity: 0,
        }}
      >
        <span
          style={{
            fontFamily:
              "'SF Pro Display', 'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.25em",
            color: "rgba(255,255,255,0.9)",
            textTransform: "uppercase",
          }}
        >
          CODIFY
        </span>
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.28)",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Loading
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Shimmer track */}
        <div
          className="loader-bar"
          style={{
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, #ef4444, #f87171, #ef4444, transparent)",
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}
