"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/store/auth.store";
import { Bell, User, LogOut, ChevronDown } from "lucide-react";

type NavbarProps = {
  title?: string;
};

export default function Navbar({ title = "Codify" }: NavbarProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
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
      case "STUDENT":
        return "/student/dashboard";
      case "INTERN":
        return "/intern/dashboard";
      case "TEACHER":
        return "/teacher";
      case "ADMIN":
        return "/admin";
      default:
        return "/dashboard";
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href={getDashboardUrl()} className="flex items-center gap-3">
          <Logo size="md" />
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <button className="relative rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition">
                <Bell size={20} />
                {/* Simulated notification badge */}
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-3 pr-2 py-1.5 text-sm text-zinc-200 transition hover:border-red-500/20 hover:bg-red-500/10"
                >
                  <div className="flex flex-col items-start leading-none mr-1">
                    <span className="font-medium">{user?.email?.split("@")[0]}</span>
                    <span className="text-[10px] text-zinc-500 capitalize">{user?.role?.toLowerCase()}</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
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
              </div>
            </>
          ) : (
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-200 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-white"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
