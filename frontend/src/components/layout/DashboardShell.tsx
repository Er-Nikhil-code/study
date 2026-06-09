"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import AppSidebar from "./AppSidebar";
import { useAuthStore } from "@/store/auth.store";
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
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dynamicNavItems = navItems || (mounted ? getSidebarNavItems(user) : []);

  return (
    <div className={`min-h-screen bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.10),_transparent_30%),linear-gradient(to_bottom,_#000,_#090909_50%,_#000)] text-white transition-all duration-300 ease-in-out ${isCollapsed ? "pl-20" : "pl-64"}`}>
      <AppSidebar 
        items={dynamicNavItems} 
        activeHref={activeHref} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section>{children}</section>
      </main>
    </div>
  );
}
