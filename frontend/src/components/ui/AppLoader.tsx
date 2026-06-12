import React from 'react';

export default function AppLoader({ message }: { message?: string }) {
  return (
    <>
      <style>{`
        /* Full-screen transparent overlay */
        .loader-overlay {
          position: fixed;
          inset: 0; /* Shorthand for top, right, bottom, left: 0 */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: transparent;
          z-index: 9999;
          /* Set to 'none' if you want users to be able to click things behind the loader */
          pointer-events: all; 
        }

        /* Continuous rotation and drop-shadow for the glow */
        .glowing-svg {
          animation: spin 2s linear infinite;
          filter: drop-shadow(0 0 8px rgba(255, 20, 20, 0.8)) 
                  drop-shadow(0 0 20px rgba(255, 20, 20, 0.5));
        }

        /* SVG Circle path styling */
        .ring-path {
          stroke: #ff2a2a; /* Bright red */
          /* Creates the broken gaps: dash length, gap length, dash length, etc. */
          stroke-dasharray: 70 25 15 35 40 30;
          animation: pulse-glow 2s ease-in-out infinite alternate;
        }

        /* Rotates the entire ring */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Slightly pulses the stroke width to make the glow feel alive */
        @keyframes pulse-glow {
          0% { stroke-width: 5px; }
          100% { stroke-width: 7px; }
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
          <circle
            className="ring-path"
            cx="50"
            cy="50"
            r="40"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
        {message && (
          <p className="mt-8 text-[11px] font-medium tracking-[0.4em] text-red-500/80 uppercase animate-pulse">
            {message}
          </p>
        )}
      </div>
    </>
  );
}
