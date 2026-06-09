"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";

import { useAuthStore } from "@/store/auth.store";

interface Props {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const setAuth = useAuthStore((state) => state.setAuth);

  const logout = useAuthStore((state) => state.logout);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          logout();
          return;
        }

        const { data } = await api.get("/auth/me");

        // Use the FRESH token from /auth/me which includes role in JWT payload
        const freshToken = data.accessToken || token;
        localStorage.setItem("accessToken", freshToken);
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken);
        }

        setAuth(data.user, freshToken);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [logout, setAuth]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
