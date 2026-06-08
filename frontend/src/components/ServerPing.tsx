"use client";

import { useEffect } from "react";

const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

/**
 * Background component that pings the server health endpoint every 4 minutes
 * to prevent Railway from sleeping the backend.
 * Renders nothing — purely side-effect-based.
 */
export default function ServerPing() {
  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const pingUrl = `${apiUrl}/health/ping`;

    const ping = async () => {
      try {
        await fetch(pingUrl, { method: "GET", cache: "no-store" });
      } catch {
        // Silently ignore — server might be cold-starting
      }
    };

    // Initial ping after a short delay (let the app hydrate first)
    const initialTimeout = setTimeout(ping, 5000);

    // Recurring ping
    const interval = setInterval(ping, PING_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return null;
}
