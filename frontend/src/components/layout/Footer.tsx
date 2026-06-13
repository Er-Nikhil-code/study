"use client";

import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/ui.store";
import { useEffect, useState } from "react";

export default function Footer() {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useUIStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === "/") return null;

  const isDashboard = pathname.startsWith("/admin") || 
                      pathname.startsWith("/teacher") || 
                      pathname.startsWith("/intern") || 
                      pathname.startsWith("/student");

  // Determine left padding to align with DashboardShell sidebar
  const paddingClass = isDashboard 
    ? (isSidebarCollapsed ? "pl-20" : "pl-64")
    : "";

  return (
    <footer className={`w-full pb-3 pt-1 mt-auto bg-transparent flex flex-col items-center overflow-hidden ${!mounted ? "transition-none" : "transition-all duration-300 ease-in-out"} ${paddingClass}`}>
      {/* Elegant Divider */}
      <div className="w-full flex justify-center mb-3">
        <div className="flex items-center gap-4 opacity-50 w-full max-w-3xl">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-600/50 to-red-600" />
          <span className="text-[9px] text-red-500/80 uppercase tracking-[0.4em] font-semibold">codify</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-red-600/50 to-red-600" />
        </div>
      </div>

      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center text-zinc-500 text-[11px] tracking-wider font-light">
        <span>© {new Date().getFullYear()} Codify. All rights reserved.</span>
        <span className="hidden md:inline mx-3 text-zinc-700">•</span>
        <a 
          href="mailto:support@codify.today" 
          className="mt-1 md:mt-0 hover:text-red-400 transition-colors duration-200"
        >
          support@codify.today
        </a>
      </div>
    </footer>
  );
}
