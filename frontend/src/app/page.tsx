"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import Logo from "@/components/ui/Logo";
import HeroBackground3D from "@/components/ui/HeroBackground3D";
import { ArrowRight, MessageSquare } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "ADMIN") router.push("/admin");
      else if (user.role === "TEACHER") router.push("/teacher");
      else if (user.role === "INTERN") router.push("/intern/dashboard");
      else router.push("/student/dashboard");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="relative min-h-screen bg-[#09090b] text-white selection:bg-[#ff4e00]/30 overflow-hidden font-sans">
      <HeroBackground3D />

      {/* Top Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Logo size="md" />
        </div>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
          <Link href="#" className="px-5 py-1.5 text-sm font-medium bg-[#ff4e00] rounded-full text-white shadow-[0_0_15px_rgba(255,78,0,0.5)]">
            Home
          </Link>
          <Link href="#" className="px-5 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition">
            Feature
          </Link>
          <Link href="#" className="px-5 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition">
            Pricing
          </Link>
          <Link href="#" className="px-5 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition">
            FAQ
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <a href="#" className="hidden md:flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition">
            <MessageSquare size={16} /> Join in Discord
          </a>
          <Link 
            href="/login" 
            className="px-5 py-2 text-sm font-semibold bg-[#ff4e00] hover:bg-[#ff6a00] text-white rounded-full transition shadow-[0_0_20px_rgba(255,78,0,0.4)]"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 flex flex-col items-center justify-center pt-24 pb-32 px-4 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md text-sm text-zinc-300">
          Learning Solution in One Platform <ArrowRight size={14} className="text-zinc-500" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 leading-[1.1]">
          Unlock The Power <br />
          <span className="text-zinc-400 font-normal">Of AI-Driven Learning</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Gain deep insights into your performance data and make smarter decisions. 
          Turn practice into strategies that drive growth and efficiency.
        </p>
        
        <Link 
          href="/login" 
          className="px-8 py-3.5 text-base font-semibold bg-gradient-to-r from-[#ff4e00] to-[#ff8a00] text-white rounded-full transition hover:scale-105 shadow-[0_0_30px_rgba(255,78,0,0.5)]"
        >
          Let's Get Started
        </Link>
      </main>

      {/* Dashboard Mockup Embed */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pb-24">
        <div className="relative rounded-2xl border border-white/10 bg-[#18181b]/80 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9]">
          {/* Subtle top reflection */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          {/* Mockup Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
          </div>
          
          {/* Mockup Body */}
          <div className="flex h-full">
            {/* Sidebar Mock */}
            <div className="hidden md:flex w-64 border-r border-white/5 p-4 flex-col gap-2">
              <div className="h-10 bg-[#ff4e00]/20 border border-[#ff4e00]/30 rounded-lg flex items-center px-4">
                <div className="w-4 h-4 rounded bg-[#ff4e00]" />
                <div className="h-2 w-20 bg-[#ff4e00] ml-3 rounded" />
              </div>
              <div className="h-10 hover:bg-white/5 rounded-lg flex items-center px-4 transition">
                <div className="w-4 h-4 rounded bg-zinc-700" />
                <div className="h-2 w-16 bg-zinc-600 ml-3 rounded" />
              </div>
              <div className="h-10 hover:bg-white/5 rounded-lg flex items-center px-4 transition">
                <div className="w-4 h-4 rounded bg-zinc-700" />
                <div className="h-2 w-24 bg-zinc-600 ml-3 rounded" />
              </div>
            </div>
            {/* Content Mock */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col gap-6">
              <div className="h-6 w-48 bg-zinc-800 rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-gradient-to-br from-[#ff4e00] to-[#ff8a00] rounded-xl p-5 flex flex-col justify-between shadow-[0_0_30px_rgba(255,78,0,0.3)]">
                  <div className="w-8 h-8 bg-white/20 rounded-lg" />
                  <div className="h-4 w-32 bg-white rounded" />
                </div>
                <div className="h-32 bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
                  <div className="w-8 h-8 bg-white/10 rounded-lg" />
                  <div className="h-4 w-32 bg-zinc-700 rounded" />
                </div>
                <div className="h-32 bg-zinc-900 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
                  <div className="w-8 h-8 bg-white/10 rounded-lg" />
                  <div className="h-4 w-28 bg-zinc-700 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
                <div className="h-48 bg-zinc-900 border border-white/5 rounded-xl p-5" />
                <div className="h-48 bg-zinc-900 border border-white/5 rounded-xl p-5 flex items-end gap-2">
                  <div className="flex-1 bg-zinc-800 rounded-t-sm h-[40%]" />
                  <div className="flex-1 bg-zinc-800 rounded-t-sm h-[60%]" />
                  <div className="flex-1 bg-gradient-to-t from-[#ff8a00] to-[#ff4e00] rounded-t-sm h-[90%] shadow-[0_0_20px_rgba(255,78,0,0.4)]" />
                  <div className="flex-1 bg-zinc-800 rounded-t-sm h-[50%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
