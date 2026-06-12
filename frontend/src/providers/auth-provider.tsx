"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import AppLoader from "@/components/ui/AppLoader";

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
        const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

        if (!token) {
          logout();
          setLoading(false);
          return;
        }

        // Optimistic Load: If Zustand already has a persisted user, we can render the app instantly!
        // We still fetch /auth/me in the background to ensure roles/tokens are fresh.
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          setLoading(false);
        }

        const { data } = await api.get("/auth/me");

        const freshToken = data.accessToken || token;
        
        // If it was in sessionStorage, keep it in sessionStorage
        if (sessionStorage.getItem("accessToken")) {
          sessionStorage.setItem("accessToken", freshToken);
        } else {
          localStorage.setItem("accessToken", freshToken);
        }
        
        if (data.refreshToken) {
          if (sessionStorage.getItem("refreshToken")) {
            sessionStorage.setItem("refreshToken", data.refreshToken);
          } else {
            localStorage.setItem("refreshToken", data.refreshToken);
          }
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
    return <AppLoader />;
  }

  return <>{children}</>;
}
