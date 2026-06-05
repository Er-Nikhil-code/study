"use client";

import { useEffect, useState } from "react";

export default function MountainClimbAnimation() {
  const [phase, setPhase] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 5);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === 3) {
      setShowFireworks(true);
      const timer = setTimeout(() => setShowFireworks(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes climb {
          0% { transform: translateY(80px) translateX(0px); }
          50% { transform: translateY(40px) translateX(0px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        
        @keyframes struggle {
          0%, 100% { transform: translateY(-10px); }
          25% { transform: translateY(0px) rotateZ(-2deg); }
          50% { transform: translateY(-15px) rotateZ(2deg); }
          75% { transform: translateY(0px) rotateZ(-2deg); }
        }
        
        @keyframes jump {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes wave {
          0%, 100% { transform: rotateZ(-30deg); }
          50% { transform: rotateZ(30deg); }
        }
        
        @keyframes firework {
          0% {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0);
          }
        }
        
        @keyframes celebrate {
          0%, 100% { transform: translateY(0px) rotateZ(0deg); }
          25% { transform: translateY(-15px) rotateZ(-5deg); }
          50% { transform: translateY(-20px) rotateZ(5deg); }
          75% { transform: translateY(-15px) rotateZ(-5deg); }
        }
        
        .climbing {
          animation: climb 2s ease-in-out;
        }
        
        .struggling {
          animation: struggle 1s ease-in-out;
        }
        
        .jumping {
          animation: jump 0.6s ease-out;
        }
        
        .celebrating {
          animation: celebrate 0.8s ease-in-out infinite;
        }
        
        .flag-wave {
          animation: wave 0.5s ease-in-out;
        }
        
        .firework-particle {
          animation: firework 1.5s ease-out forwards;
        }
      `}</style>

      <svg
        viewBox="0 0 500 600"
        className="w-full h-full max-w-2xl"
        style={{ filter: "drop-shadow(0 20px 40px rgba(220, 38, 38, 0.2))" }}
      >
        {/* Sky */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#2d2d2d" />
          </linearGradient>
        </defs>
        <rect width="500" height="600" fill="url(#skyGradient)" />

        {/* Stars */}
        <circle cx="50" cy="50" r="2" fill="#fff" opacity="0.8" />
        <circle cx="150" cy="80" r="1.5" fill="#fff" opacity="0.6" />
        <circle cx="400" cy="40" r="1.5" fill="#fff" opacity="0.7" />
        <circle cx="450" cy="120" r="1" fill="#fff" opacity="0.5" />

        {/* Mountain */}
        <g id="mountain">
          {/* Mountain base - large triangle */}
          <polygon
            points="100,550 250,150 400,550"
            fill="#444"
            stroke="#666"
            strokeWidth="2"
          />

          {/* Mountain highlight */}
          <polygon points="250,150 350,450 250,550" fill="#555" opacity="0.6" />

          {/* Snow cap */}
          <polygon points="250,150 280,220 220,220" fill="#fff" opacity="0.9" />

          {/* Rock obstacles on mountain */}
          {/* Obstacle 1 */}
          <rect x="240" y="300" width="30" height="40" fill="#333" rx="3" />
          <rect
            x="242"
            y="302"
            width="26"
            height="10"
            fill="#666"
            rx="2"
            opacity="0.7"
          />

          {/* Obstacle 2 */}
          <rect x="220" y="420" width="35" height="35" fill="#333" rx="3" />
          <circle cx="237" cy="432" r="5" fill="#666" opacity="0.7" />

          {/* Obstacle 3 */}
          <rect x="260" y="250" width="25" height="45" fill="#333" rx="3" />
        </g>

        {/* Mountain path indicator */}
        <path
          d={`M 250 550 Q 245 480 248 400 Q 250 320 252 240`}
          stroke="#dc2626"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
          strokeDasharray="5,5"
        />

        {/* Boy climber */}
        <g
          id="boy"
          className={
            phase === 0
              ? "climbing"
              : phase === 1
                ? "struggling"
                : phase === 2
                  ? "jumping"
                  : phase === 3
                    ? "celebrating"
                    : ""
          }
        >
          {/* Boy's body - simplified */}
          <circle cx="250" cy="480" r="15" fill="#f59e0b" /> {/* Head */}
          <rect x="240" y="498" width="20" height="35" fill="#ef4444" />{" "}
          {/* Body/shirt */}
          <rect x="237" y="533" width="8" height="25" fill="#374151" />{" "}
          {/* Left leg */}
          <rect x="255" y="533" width="8" height="25" fill="#374151" />{" "}
          {/* Right leg */}
          <rect x="235" y="510" width="8" height="20" fill="#fbbf24" />{" "}
          {/* Left arm */}
          <rect x="257" y="510" width="8" height="20" fill="#fbbf24" />{" "}
          {/* Right arm */}
          {/* Face */}
          <circle cx="245" cy="476" r="2.5" fill="#000" /> {/* Left eye */}
          <circle cx="255" cy="476" r="2.5" fill="#000" /> {/* Right eye */}
          <path
            d="M 245 485 Q 250 488 255 485"
            stroke="#000"
            strokeWidth="1"
            fill="none"
          />{" "}
          {/* Mouth */}
        </g>

        {/* Flag at the top */}
        <g
          id="flag"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transition: "opacity 0.5s ease",
            transformOrigin: "250px 150px",
          }}
        >
          {/* Flag pole */}
          <rect x="248" y="120" width="4" height="40" fill="#8b7355" />
          {/* Flag */}
          <g className={phase >= 2 ? "flag-wave" : ""}>
            <rect
              x="252"
              y="120"
              width="35"
              height="20"
              fill="#dc2626"
              rx="2"
            />
            <circle cx="260" cy="128" r="3" fill="#fff" />
            <circle cx="273" cy="125" r="2" fill="#fff" opacity="0.7" />
          </g>
        </g>

        {/* Celebration text */}
        {phase === 3 && (
          <>
            <text
              x="250"
              y="100"
              textAnchor="middle"
              fontSize="24"
              fill="#dc2626"
              fontWeight="bold"
            >
              🎉
            </text>
            <text
              x="200"
              y="110"
              textAnchor="middle"
              fontSize="16"
              fill="#fbbf24"
              fontWeight="bold"
            >
              YES!
            </text>
            <text
              x="300"
              y="110"
              textAnchor="middle"
              fontSize="16"
              fill="#fbbf24"
              fontWeight="bold"
            >
              SUCCESS!
            </text>
          </>
        )}
      </svg>

      {/* Fireworks effect */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = (i / 30) * Math.PI * 2;
            const distance = 80;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;

            return (
              <div
                key={i}
                className="firework-particle absolute w-3 h-3 rounded-full"
                style={
                  {
                    left: "50%",
                    top: "25%",
                    "--tx": `${tx}px`,
                    "--ty": `${ty}px`,
                    backgroundColor: [
                      "#dc2626",
                      "#fbbf24",
                      "#10b981",
                      "#3b82f6",
                    ][i % 4],
                    marginLeft: "-6px",
                    marginTop: "-6px",
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}

      {/* Motivational text */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <p className="text-gray-400 text-sm">
          {phase === 0 && "📚 Starting the climb..."}
          {phase === 1 && "💪 Overcoming obstacles..."}
          {phase === 2 && "🏔️ Almost there..."}
          {phase === 3 && "🏆 SUCCESS! You made it!"}
          {phase === 4 && "🎊 Keep pushing forward!"}
        </p>
      </div>
    </div>
  );
}
