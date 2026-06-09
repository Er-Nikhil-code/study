import "./globals.css";
import "katex/dist/katex.min.css";

import QueryProvider from "@/providers/query-provider";
import ThemeProvider from "@/providers/theme-provider";
import AuthProvider from "@/providers/auth-provider";
import SocketProvider from "@/providers/socket-provider";
import ToastProvider from "@/providers/toast-provider";
import RealtimeEvents from "@/components/realtime/RealtimeEvents";
import ServerPing from "@/components/ServerPing";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Codify | Advanced Learning Management System",
  description: "Codify is a comprehensive educational content management, question bank, testing, and learning management platform. Master your learning with automated tests, detailed performance analytics, and dynamic content creation.",
  keywords: "Codify, LMS, Learning Management System, Question Bank, Online Testing, Education",
  openGraph: {
    title: "Codify",
    description: "An advanced educational content management and testing platform.",
    type: "website",
    siteName: "Codify"
  }
};

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
