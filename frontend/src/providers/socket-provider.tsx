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
      transports: ["websocket"],

      auth: {
        token,
      },
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
