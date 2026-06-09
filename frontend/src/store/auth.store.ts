"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "STUDENT" | "INTERN" | "PENDING_TEACHER" | "TEACHER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  custom_role?: {
    name: string;
    permissions_json: any;
  } | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;

  isAuthenticated: boolean;

  setAuth: (user: AuthUser, accessToken: string) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        localStorage.setItem("accessToken", accessToken);

        set({
          user,
          accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem("accessToken");

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "codify-auth",
    },
  ),
);
