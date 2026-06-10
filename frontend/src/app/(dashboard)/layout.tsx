"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <DashboardShell activeHref={pathname}>
      {children}
    </DashboardShell>
  );
}
