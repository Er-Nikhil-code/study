"use client";

import { useSocket } from "@/providers/socket-provider";

export default function useRealtime() {
  const socket = useSocket();

  return socket;
}
