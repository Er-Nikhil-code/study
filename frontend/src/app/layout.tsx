import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Platform",
  description: "Learn and teach with our comprehensive study platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
