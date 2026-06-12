"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "STUDENT" | "INTERN" | "TEACHER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  profile_picture?: string;
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
        // Token is already set by authService, so we just update Zustand state
        set({
          user,
          accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        // Token removal is handled by authService or logout logic
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
        if (typeof window !== "undefined" && window.location.pathname !== "/") {
          window.location.href = "/";
        }
      },
    }),
    {
      name: "codify-auth",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          return localStorage.getItem(name) || sessionStorage.getItem(name);
        },
        setItem: (name, value) => {
          if (sessionStorage.getItem('sessionOnly') === 'true') {
            sessionStorage.setItem(name, value);
            localStorage.removeItem(name);
          } else {
            localStorage.setItem(name, value);
            sessionStorage.removeItem(name);
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
          sessionStorage.removeItem(name);
        }
      })),
    },
  ),
);
