"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/store/auth.store";
import adminService from "@/services/admin.service";
import {
  LogOut, ChevronDown, ChevronLeft, ChevronRight,
  User, Swords,
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import { getChessRoleName } from "@/lib/role";
import { useQuery } from "@tanstack/react-query";
import { Caveat, Montserrat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["800"] });

type AppSidebarProps = {
  items: NavItem[];
  activeHref?: string;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
};

export default function AppSidebar({ items, activeHref, isCollapsed, setIsCollapsed }: AppSidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => adminService.getNotifications({ limit: 1 }),
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
  const unreadCount = notificationsData?.unread_count || 0;

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handlePrefetch = (href: string) => {
    if (href === "/admin") {
      queryClient.prefetchQuery({
        queryKey: ["admin", "dashboard", "stats"],
        queryFn: () => adminService.getDashboardStats(),
      });
    } else if (href === "/admin/users") {
      queryClient.prefetchQuery({
        queryKey: ["admin", "users", { search: "", roleFilter: "ALL", page: 0 }],
        queryFn: () => adminService.getUsers({ page: 1, limit: 15 }),
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDashboardUrl = () => {
    if (!mounted || !isAuthenticated || !user) return "/";
    switch (user.role) {
      case "STUDENT": return "/student/dashboard";
      case "INTERN": return "/intern/dashboard";
      case "TEACHER": return "/teacher";
      case "ADMIN": return "/admin";
      default: return "/dashboard";
    }
  };

  const handleLogout = () => logout();

  const firstName = (user as any)?.first_name || user?.firstName;
  const displayName = firstName || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col
        bg-[#080808] border-r border-white/[0.06]
        ${!mounted ? "transition-none" : "transition-[width] duration-300 ease-in-out"}
        ${isCollapsed ? "w-[60px]" : "w-56"}`}
    >
      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className={`flex h-14 items-center border-b border-white/[0.06] shrink-0
        ${isCollapsed ? "justify-center px-0" : "px-4 gap-2.5"}`}>
        <Link href={getDashboardUrl()} className="flex items-center gap-2.5 shrink-0">
          {/* Icon mark — always visible */}
          <div className={`flex items-center justify-center rounded-lg bg-red-600/10 border border-red-500/20
            shadow-[0_0_12px_rgba(220,38,38,0.2)] shrink-0 relative
            ${montserrat.className} font-extrabold text-red-500 transition-all duration-200
            ${isCollapsed ? "h-9 w-9 text-lg" : "h-8 w-8 text-base"}`}>
            C
            <span className={`absolute -right-2 -bottom-1.5 text-[8px] text-red-400 lowercase -rotate-12 ${caveat.className}`}>
              today
            </span>
          </div>
          {/* Wordmark */}
          {!isCollapsed && (
            <span className={`text-white text-sm font-bold tracking-wider ${montserrat.className}`}>
              CODIFY
            </span>
          )}
        </Link>
      </div>

      {/* ── Collapse toggle ──────────────────────────────────────── */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-[52px] z-50 flex h-5.5 w-5.5 items-center justify-center
          rounded-full border border-white/10 bg-[#111] text-zinc-500
          hover:text-white hover:border-white/20 hover:bg-[#1a1a1a]
          shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        style={{ width: 22, height: 22 }}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-none">
        <div className={`flex flex-col gap-0.5 ${isCollapsed ? "px-2" : "px-2"}`}>
          {items.map((item) => {
            const active = activeHref === item.href ||
              (activeHref && activeHref.startsWith(item.href) && item.href !== "/" && item.href !== "#");
            const isExpanded = expandedMenus.includes(item.label);
            const Icon = item.icon;
            const hasNotif = item.href === "/notifications" && unreadCount > 0;

            return (
              <div key={item.label}>
                {item.subItems ? (
                  <button
                    onClick={() => { if (isCollapsed) setIsCollapsed(false); toggleMenu(item.label); }}
                    title={isCollapsed ? item.label : undefined}
                    className={`group w-full flex items-center rounded-lg px-2.5 py-2 text-[13px] font-medium
                      transition-colors duration-150
                      ${isCollapsed ? "justify-center" : "justify-between gap-2.5"}
                      ${active
                        ? "bg-red-500/[0.12] text-red-400"
                        : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                      }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "" : "gap-2.5"}`}>
                      <div className="relative shrink-0">
                        <Icon size={18} className={active ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                        {hasNotif && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                          </span>
                        )}
                      </div>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown size={13} className={`text-zinc-600 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onMouseEnter={() => handlePrefetch(item.href)}
                    title={isCollapsed ? item.label : undefined}
                    className={`group flex items-center rounded-lg px-2.5 py-2 text-[13px] font-medium
                      transition-colors duration-150 relative
                      ${isCollapsed ? "justify-center" : "gap-2.5"}
                      ${active
                        ? "bg-red-500/[0.12] text-red-400 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.12)]"
                        : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
                      }`}
                  >
                    {/* Active left bar */}
                    {active && !isCollapsed && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-red-500" />
                    )}
                    <div className="relative shrink-0">
                      <Icon size={18} className={active ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                      {hasNotif && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                        </span>
                      )}
                    </div>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                )}

                {/* Sub-items */}
                {item.subItems && isExpanded && !isCollapsed && (
                  <div className="mt-0.5 ml-5 pl-2.5 border-l border-white/[0.07] flex flex-col gap-0.5 mb-1">
                    {item.subItems.map((sub) => {
                      const subActive = activeHref === sub.href ||
                        (activeHref && activeHref.startsWith(sub.href) && sub.href !== "/" && sub.href !== "#");
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors duration-150
                            ${subActive ? "bg-red-500/10 text-red-400" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"}`}
                        >
                          <SubIcon size={14} />
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── User / Profile ───────────────────────────────────────── */}
      <div className="shrink-0 p-2 border-t border-white/[0.06]" ref={dropdownRef}>
        {/* Profile dropdown */}
        {isProfileOpen && mounted && (
          <div className={`absolute bottom-full mb-2 rounded-xl border border-white/10 bg-[#111] shadow-xl
            ${isCollapsed ? "left-2 right-2" : "left-2 right-2"}`}>
            <div className="p-1">
              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                <User size={14} /> Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}

        {mounted && isAuthenticated && user ? (
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            title={isCollapsed ? displayName : undefined}
            className={`w-full flex items-center rounded-xl p-2 gap-2.5
              border border-transparent hover:border-white/[0.08] hover:bg-white/[0.04]
              transition-colors duration-150
              ${isCollapsed ? "justify-center" : ""}`}
          >
            {/* Avatar */}
            <div className="h-7 w-7 shrink-0 rounded-full overflow-hidden border border-white/10
              bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">
              {user?.profile_picture ? (
                <Image src={user.profile_picture} alt="Profile" width={28} height={28} className="h-full w-full object-cover" />
              ) : initials}
            </div>

            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[12px] font-semibold text-white truncate">{displayName}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{getChessRoleName(user?.role)}</div>
                </div>
                <ChevronDown size={12} className={`text-zinc-600 shrink-0 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>
        ) : !isCollapsed ? (
          <Link
            href="/"
            className="flex w-full justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
          >
            Log in
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
