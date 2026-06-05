"use client";

import { useEffect, useState } from "react";

export default function ElegantClimbAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-40 h-48 mx-auto">
      <style>{`
        @keyframes flow-up {
          0% { transform: translateY(20px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-80px); opacity: 0; }
        }
        
        @keyframes pulse-ring {
          0%, 100% { r: 20px; opacity: 0.8; stroke-width: 1px; }
          50% { r: 35px; opacity: 0.3; stroke-width: 0.5px; }
        }
        
        @keyframes rotate-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        .flow-particle {
          animation: flow-up 2.5s ease-out infinite;
        }
        
        .ring {
          animation: pulse-ring 2s ease-in-out infinite;
        }
        
        .rotating {
          animation: rotate-slow 8s linear infinite;
        }
        
        .shimmer-line {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Main SVG */}
      <svg
        viewBox="0 0 160 200"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 10px 25px rgba(220, 38, 38, 0.15))" }}
      >
        {/* Background Elements */}
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(220, 38, 38, 0)" />
            <stop offset="50%" stopColor="rgba(220, 38, 38, 0.6)" />
            <stop offset="100%" stopColor="rgba(220, 38, 38, 0.3)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pulsing circles - minimalist design */}
        <circle
          cx="80"
          cy="100"
          r="25"
          fill="none"
          stroke="rgba(220, 38, 38, 0.4)"
          strokeWidth="1"
          className="ring"
        />

        {/* Central elegant shape - flowing liquid effect */}
        <path
          d="M 80 40 Q 60 70, 70 100 Q 60 130, 80 160 Q 100 130, 90 100 Q 100 70, 80 40 Z"
          fill="rgba(220, 38, 38, 0.15)"
          stroke="rgba(220, 38, 38, 0.4)"
          strokeWidth="1.5"
          filter="url(#glow)"
        />

        {/* Rotating element around center */}
        <g className="rotating">
          <circle cx="80" cy="50" r="3" fill="rgba(220, 38, 38, 0.7)" />
          <circle cx="110" cy="100" r="3" fill="rgba(220, 38, 38, 0.7)" />
          <circle cx="80" cy="150" r="3" fill="rgba(220, 38, 38, 0.7)" />
          <circle cx="50" cy="100" r="3" fill="rgba(220, 38, 38, 0.7)" />
        </g>

        {/* Center point */}
        <circle
          cx="80"
          cy="100"
          r="4"
          fill="rgba(220, 38, 38, 0.9)"
          filter="url(#glow)"
        />

        {/* Flowing particles */}
        {phase === 0 && (
          <>
            <circle
              cx="80"
              cy="100"
              r="2"
              fill="rgba(220, 38, 38, 0.8)"
              className="flow-particle"
              style={{ animationDelay: "0s" }}
            />
            <circle
              cx="80"
              cy="100"
              r="2"
              fill="rgba(220, 38, 38, 0.8)"
              className="flow-particle"
              style={{ animationDelay: "0.6s" }}
            />
            <circle
              cx="80"
              cy="100"
              r="2"
              fill="rgba(220, 38, 38, 0.8)"
              className="flow-particle"
              style={{ animationDelay: "1.2s" }}
            />
          </>
        )}

        {/* State indicators - minimalist lines */}
        {phase === 1 && (
          <>
            <line
              x1="50"
              y1="100"
              x2="110"
              y2="100"
              stroke="rgba(220, 38, 38, 0.5)"
              strokeWidth="1"
              className="shimmer-line"
            />
          </>
        )}

        {phase === 2 && (
          <>
            <line
              x1="80"
              y1="70"
              x2="80"
              y2="130"
              stroke="rgba(220, 38, 38, 0.5)"
              strokeWidth="1"
              className="shimmer-line"
            />
          </>
        )}

        {phase === 3 && (
          <>
            <circle
              cx="80"
              cy="100"
              r="30"
              fill="none"
              stroke="rgba(220, 38, 38, 0.4)"
              strokeWidth="1"
              className="shimmer-line"
            />
          </>
        )}
      </svg>
    </div>
  );
}
