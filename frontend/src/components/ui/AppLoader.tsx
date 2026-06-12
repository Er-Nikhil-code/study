import React from 'react';

export default function AppLoader({ message }: { message?: string }) {
  return (
    <>
      <style>{`
        /* Full-screen transparent overlay */
        .loader-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: transparent;
          z-index: 9999;
          pointer-events: all; 
        }

        /* SVG container with global glow */
        .glowing-svg {
          filter: drop-shadow(0 0 8px rgba(255, 20, 20, 0.8)) 
                  drop-shadow(0 0 20px rgba(255, 20, 20, 0.5));
        }

        /* Concentric Rings */
        .ring-1 {
          stroke: #ff2a2a;
          stroke-dasharray: 60 20 15 30 40 25;
          animation: spin 3s linear infinite, pulse-glow 2s ease-in-out infinite alternate;
          transform-origin: 50% 50%;
        }

        .ring-2 {
          stroke: #ff4a4a;
          stroke-dasharray: 40 30 20 40;
          animation: spin-reverse 2s linear infinite, pulse-glow 2s ease-in-out infinite alternate 0.5s;
          transform-origin: 50% 50%;
        }

        .ring-3 {
          stroke: #ff7a7a;
          stroke-dasharray: 30 15 25 35;
          animation: spin 1.5s linear infinite, pulse-glow 2s ease-in-out infinite alternate 1s;
          transform-origin: 50% 50%;
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        @keyframes pulse-glow {
          0% { stroke-width: 2px; opacity: 0.8; }
          100% { stroke-width: 5px; opacity: 1; }
        }
      `}</style>

      <div className="loader-overlay">
        <svg
          className="glowing-svg"
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Ring */}
          <circle
            className="ring-1"
            cx="50"
            cy="50"
            r="42"
            strokeLinecap="round"
          />
          {/* Middle Ring */}
          <circle
            className="ring-2"
            cx="50"
            cy="50"
            r="30"
            strokeLinecap="round"
          />
          {/* Inner Ring */}
          <circle
            className="ring-3"
            cx="50"
            cy="50"
            r="18"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
}
