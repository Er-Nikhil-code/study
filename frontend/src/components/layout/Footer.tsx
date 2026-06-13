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

  const isAdminPage = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/admin") || 
                      pathname.startsWith("/teacher") || 
                      pathname.startsWith("/intern") || 
                      pathname.startsWith("/student");

  // Determine left padding to align with DashboardShell sidebar
  const paddingClass = isDashboard 
    ? (isSidebarCollapsed ? "pl-20" : "pl-64")
    : "";

  return (
    <footer className={`w-full py-6 mt-auto border-t border-white/5 bg-transparent ${!mounted ? "transition-none" : "transition-all duration-300 ease-in-out"} ${paddingClass}`}>
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center text-zinc-500 text-xs tracking-wider font-light">
        <span>© {new Date().getFullYear()} Codify. All rights reserved.</span>
        {!isAdminPage && (
          <>
            <span className="hidden md:inline mx-3">•</span>
            <a 
              href="mailto:support@codify.today" 
              className="mt-2 md:mt-0 hover:text-white transition-colors duration-200"
            >
              support@codify.today
            </a>
          </>
        )}
      </div>
    </footer>
  );
}
