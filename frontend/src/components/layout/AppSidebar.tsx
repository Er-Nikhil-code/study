"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/store/auth.store";
import { LogOut, ChevronDown, ChevronLeft, ChevronRight, User } from "lucide-react";
import type { NavItem } from "@/lib/nav";

type AppSidebarProps = {
  items: NavItem[];
  activeHref?: string;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
};

export default function AppSidebar({ items, activeHref, isCollapsed, setIsCollapsed }: AppSidebarProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDashboardUrl = () => {
    if (!isAuthenticated || !user) return "/";
    switch (user.role) {
      case "STUDENT": return "/student/dashboard";
      case "INTERN": return "/intern/dashboard";
      case "TEACHER": return "/teacher";
      case "ADMIN": return "/admin";
      default: return "/dashboard";
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-black/70 backdrop-blur-xl transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header / Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
          <Link href={getDashboardUrl()} className="flex items-center gap-3 shrink-0">
            <Logo size="sm" />
          </Link>
        </div>
        {/* If collapsed, show a mini version of the logo */}
        {isCollapsed && (
          <Link href={getDashboardUrl()} className="flex shrink-0 items-center justify-center w-full">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 font-bold text-white">C</div>
          </Link>
        )}
      </div>

      {/* Toggle Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black text-zinc-400 hover:text-white transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
        <nav className="flex flex-col space-y-1 px-3">
          {items.map((item) => {
            const active = activeHref === item.href || (activeHref && activeHref.startsWith(item.href) && item.href !== "/");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={[
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-red-500/10 text-red-400"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                  isCollapsed ? "justify-center" : "justify-start gap-3",
                ].join(" ")}
              >
                <Icon size={20} className={active ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-white/10 relative" ref={dropdownRef}>
        {isAuthenticated && user ? (
          <>
            {/* Dropdown menu — shows both in collapsed and expanded mode */}
            {isProfileOpen && (
              <div className={`absolute bottom-full mb-2 rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none ${
                isCollapsed ? "left-2 right-2 min-w-[160px]" : "left-4 right-4"
              }`}>
                <Link
                  href="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                >
                  <User size={16} />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}

            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title={isCollapsed ? "Profile" : undefined}
              className={[
                "flex w-full items-center rounded-xl border border-white/10 bg-white/[0.03] p-2 transition hover:border-red-500/20 hover:bg-red-500/10",
                isCollapsed ? "justify-center" : "justify-between gap-2"
              ].join(" ")}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-500 font-bold uppercase overflow-hidden">
                  {user?.profile_picture ? (
                     <img src={user.profile_picture} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    (user as any)?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col items-start leading-none text-left truncate">
                    <span className="text-sm font-medium text-zinc-200 truncate w-28">{(user as any)?.firstName || user?.email?.split("@")[0]}</span>
                    <span className="text-[10px] text-zinc-500 capitalize">{user?.role?.toLowerCase()}</span>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
              )}
            </button>
          </>
        ) : (
          !isCollapsed && (
            <Link
              href="/"
              className="flex w-full justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              Log in
            </Link>
          )
        )}
      </div>
    </aside>
  );
}

// Ensure the scrollbar is hidden while still allowing scroll
const styles = `
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = styles;
  document.head.appendChild(style);
}
