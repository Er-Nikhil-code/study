import "./globals.css";
import "katex/dist/katex.min.css";

import QueryProvider from "@/providers/query-provider";
import ThemeProvider from "@/providers/theme-provider";
import AuthProvider from "@/providers/auth-provider";
import SocketProvider from "@/providers/socket-provider";
import ToastProvider from "@/providers/toast-provider";
import RealtimeEvents from "@/components/realtime/RealtimeEvents";
import ServerPing from "@/components/ServerPing";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <SocketProvider>
                <ToastProvider>
                  <RealtimeEvents />
                  <ServerPing />
                  {children}
                </ToastProvider>
              </SocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
