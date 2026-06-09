"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { Socket, io } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

interface Props {
  children: React.ReactNode;
}

export default function SocketProvider({ children }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ["polling", "websocket"],

      auth: { token },

      // Reconnection settings — stop spamming after a few attempts
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,

      // Timeout before giving up on a connection attempt
      timeout: 10000,
    });

    socketInstance.on("connect_error", (err) => {
      // Silent in production — avoids console spam
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Socket] Connection error:", err.message);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
