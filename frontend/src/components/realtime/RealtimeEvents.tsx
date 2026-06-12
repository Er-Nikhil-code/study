"use client";

import { useEffect } from "react";

import useRealtime from "@/hooks/useSocket";
import { useToast } from "@/hooks/useToast";

export default function RealtimeEvents() {
  const socket = useRealtime();
  const toast = useToast();

  useEffect(() => {
    if (!socket) return;

    socket.on("rank_update", (data) => {
      toast.info("Leaderboard Updated", `New Rank: #${data.rank}`);
    });

    socket.on("challenge_resolved", () => {
      toast.success("Challenge Resolved");
    });

    socket.on("teacher_approved", () => {
      toast.success("Knight Application Approved");
    });

    socket.on("notification", (data) => {
      toast.info(data.title, data.message);
    });

    return () => {
      socket.off("rank_update");
      socket.off("challenge_resolved");
      socket.off("teacher_approved");
      socket.off("notification");
    };
  }, [socket, toast]);

  return null;
}
