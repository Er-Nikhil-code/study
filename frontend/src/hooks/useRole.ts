"use client";

import { useAuthStore } from "@/store/auth.store";

export function useRole() {
  const role = useAuthStore((state) => state.user?.role);

  return {
    role,

    isStudent: role === "STUDENT",



    isTeacher: role === "TEACHER",

    isAdmin: role === "ADMIN",
  };
}
