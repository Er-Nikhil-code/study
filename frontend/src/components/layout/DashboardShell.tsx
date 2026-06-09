"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import AppSidebar from "./AppSidebar";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import { getSidebarNavItems } from "@/lib/nav";

type DashboardShellProps = {
  children: ReactNode;
  activeHref?: string;
  navItems?: { label: string; href: string; icon: any }[]; // Optional now, since we compute dynamically
};

export default function DashboardShell({
  children,
  activeHref,
  navItems,
}: DashboardShellProps) {
  const { user } = useAuthStore();
  const { isSidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dynamicNavItems = navItems || (mounted ? getSidebarNavItems(user) : []);
  const sidebarCollapsed = isSidebarCollapsed; // Use directly to avoid expansion flicker

  return (
    <div 
      suppressHydrationWarning 
      className={`min-h-screen bg-[#050505] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))] text-white ${!mounted ? "transition-none" : "transition-all duration-300 ease-in-out"} ${sidebarCollapsed ? "pl-20" : "pl-64"}`}
    >
      <AppSidebar 
        items={dynamicNavItems} 
        activeHref={activeHref} 
        isCollapsed={sidebarCollapsed} 
        setIsCollapsed={setSidebarCollapsed} 
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">{children}</section>
      </main>
    </div>
  );
}
