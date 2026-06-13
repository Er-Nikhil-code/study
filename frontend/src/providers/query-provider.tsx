"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Serve instantly from cache, but consider data stale after 1 minute to ensure background updates
            staleTime: 1000 * 60, // 1 minute caching for blazing fast UX

            gcTime: 1000 * 60 * 30, // 30 min

            retry: 2,

            // Automatically refetch in background when user switches back to the tab
            refetchOnWindowFocus: true,

            refetchOnReconnect: true,

            refetchOnMount: true,
          },

          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
