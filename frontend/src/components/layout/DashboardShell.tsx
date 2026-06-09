"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuthStore } from "@/store/auth.store";
import { getSidebarNavItems } from "@/lib/nav";

type DashboardShellProps = {
  children: ReactNode;
  activeHref?: string;
  navItems?: { label: string; href: string }[]; // Optional now, since we compute dynamically
};

export default function DashboardShell({
  children,
  activeHref,
  navItems,
}: DashboardShellProps) {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dynamicNavItems = navItems || (mounted ? getSidebarNavItems(user) : []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.10),_transparent_30%),linear-gradient(to_bottom,_#000,_#090909_50%,_#000)] text-white">
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <Sidebar items={dynamicNavItems} activeHref={activeHref} />
        <section>{children}</section>
      </main>
    </div>
  );
}
