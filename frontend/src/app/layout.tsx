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
  title: {
    template: "%s | CODIFY",
    default: "CODIFY",
  },
  description: "Codify is your all-in-one learning platform for exam preparation, coding, mock tests, PYQs, notes, quizzes, and AI-powered practice. Learn smarter, track progress, and achieve your dream score.",
  keywords: "Codify, LMS, Learning Management System, EdTech, Online Testing, Performance Analytics, Education",
  metadataBase: new URL("https://www.codify.today"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CODIFY",
    description: "Codify is your all-in-one learning platform for exam preparation, coding, mock tests, PYQs, notes, quizzes, and AI-powered practice. Learn smarter, track progress, and achieve your dream score.",
    type: "website",
    siteName: "CODIFY",
    url: "https://www.codify.today",
  },
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
