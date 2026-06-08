"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authService } from "@/services/auth.service";
import Logo from "@/components/ui/Logo";

// Main Home Page Component
export default function HomePage() {
  const [authView, setAuthView] = useState<
    "login" | "signup" | "forgot-password"
  >("login");
  const [animatedText, setAnimatedText] = useState(0);
  const [embers, setEmbers] = useState<
    Array<{
      id: number;
      left: number;
      delay: number;
      duration: number;
      drift: number;
      move1Y: number;
      move1X: number;
      move2Y: number;
      move2X: number;
      move3Y: number;
      move3X: number;
      startY: number;
      endY: number;
      size: number;
    }>
  >([]);

  const textOptions = [
    "Master Your Learning",
    "Teach with Confidence",
    "Build Your Future",
    "Ignite Your Potential",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedText((prev) => (prev + 1) % textOptions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate embers only on client side to avoid hydration mismatch
    const generatedEmbers = [...Array(60)].map((_, i) => {
      // More natural wind drift (most go slightly right or left depending on a primary wind direction)
      const baseWind = 150; 
      const randomWind = (Math.random() - 0.5) * 400;
      
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 15, // more randomized start times
        duration: 5 + Math.random() * 12, // varying speeds
        drift: baseWind + randomWind,
        move1Y: -100 - Math.random() * 200,
        move1X: (Math.random() - 0.5) * 150 + baseWind * 0.3,
        move2Y: -300 - Math.random() * 300,
        move2X: (Math.random() - 0.5) * 250 + baseWind * 0.6,
        move3Y: -600 - Math.random() * 400,
        move3X: (Math.random() - 0.5) * 350 + baseWind * 0.8,
        startY: 50 + Math.random() * 100, // start slightly below screen
        endY: -1000 - Math.random() * 500,
        size: Math.random() * 4 + 1, // smaller and larger embers
      };
    });
    setEmbers(generatedEmbers);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row items-center justify-center overflow-x-hidden overflow-y-auto md:overflow-hidden relative">
      {/* Minimalist Animated Background */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-20"
        suppressHydrationWarning
      >
        <style>{`
          @keyframes float-shape-1 {
            0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.12; }
            50% { transform: translateY(-40px) translateX(30px) scale(1.05); opacity: 0.08; }
          }
          
          @keyframes float-shape-2 {
            0%, 100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.1; }
            50% { transform: translateY(50px) translateX(-30px) scale(0.95); opacity: 0.05; }
          }
          
          @keyframes pulse-subtle {
            0%, 100% { opacity: 0.05; }
            50% { opacity: 0.12; }
          }
          
          @keyframes ember-roam {
            0% { 
              transform: translateY(var(--startY, 0px)) translateX(0px) scale(1);
              opacity: 0;
            }
            10% {
              opacity: 0.9;
            }
            25% { 
              transform: translateY(var(--move1Y, -40px)) translateX(var(--move1X, 50px)) scale(0.95);
              opacity: 0.6;
            }
            35% { opacity: 1; } /* flicker up */
            50% { 
              transform: translateY(var(--move2Y, -80px)) translateX(var(--move2X, -40px)) scale(1.1);
              opacity: 0.4;
            }
            65% { opacity: 0.8; } /* flicker up */
            75% { 
              transform: translateY(var(--move3Y, -120px)) translateX(var(--move3X, 60px)) scale(0.9);
              opacity: 0.2;
            }
            90% { opacity: 0.5; } /* last flicker */
            100% { 
              transform: translateY(var(--endY, -150px)) translateX(var(--drift, 0px)) scale(0.3);
              opacity: 0;
            }
          }
          
          @keyframes ember-glow {
            0%, 100% { box-shadow: 0 0 5px rgba(249, 115, 22, 0.8), 0 0 15px rgba(249, 115, 22, 0.5); opacity: 0.8; }
            30% { box-shadow: 0 0 10px rgba(249, 115, 22, 1), 0 0 25px rgba(249, 115, 22, 0.8), 0 0 40px rgba(220, 38, 38, 0.6); opacity: 1; }
            70% { box-shadow: 0 0 4px rgba(249, 115, 22, 0.6), 0 0 10px rgba(249, 115, 22, 0.3); opacity: 0.7; }
          }
          
          .bg-float-1 {
            position: absolute;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            filter: blur(80px);
            animation: float-shape-1 12s ease-in-out infinite;
            top: -150px;
            right: -100px;
          }
          
          .bg-float-2 {
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(185, 28, 28, 0.25) 0%, transparent 70%);
            border-radius: 50%;
            filter: blur(100px);
            animation: float-shape-2 15s ease-in-out infinite;
            bottom: -200px;
            left: -150px;
          }
          
          .bg-pulse {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.04) 0%, transparent 50%, rgba(185, 28, 28, 0.03) 100%);
            animation: pulse-subtle 6s ease-in-out infinite;
          }
          
          @keyframes ambient-glow {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.18; }
          }
          
          .ambient-fire {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at 50% 50%, rgba(248, 113, 113, 0.12) 0%, rgba(220, 38, 38, 0.06) 30%, transparent 70%);
            animation: ambient-glow 8s ease-in-out infinite;
            pointer-events: none;
          }
          
          .ember {
            position: absolute;
            border-radius: 50%;
            /* Red core with orange glow */
            background: radial-gradient(circle at 40% 40%, rgba(220, 38, 38, 0.95) 0%, rgba(239, 68, 68, 0.8) 20%, rgba(249, 115, 22, 0.6) 60%, rgba(249, 115, 22, 0.1) 100%);
            animation: ember-roam linear infinite;
            animation-play-state: running;
            mix-blend-mode: screen; /* Makes them pop vibrantly on dark backgrounds */
          }
          
          .ember::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background: transparent;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: ember-glow 3s ease-in-out infinite;
            mix-blend-mode: screen;
          }
          
          @keyframes bottom-glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.45; }
          }
          
          .bottom-ambient-glow {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 300px;
            background: linear-gradient(to top, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.15) 40%, transparent 100%);
            animation: bottom-glow 6s ease-in-out infinite;
            pointer-events: none;
          }
        `}</style>

        {/* Floating shape 1 */}
        <div className="bg-float-1" />

        {/* Floating shape 2 */}
        <div className="bg-float-2" />

        {/* Subtle pulse overlay */}
        <div className="bg-pulse" />

        {/* Ambient fire glow across entire screen */}
        <div className="ambient-fire" />

        {/* Bottom ambient glow */}
        <div className="bottom-ambient-glow" />

        {/* Fire Embers - scattered across screen */}
        {embers.map((ember, index) => (
          <div
            key={ember.id}
            className={`ember ${index % 4 !== 0 ? 'hidden md:block' : ''}`}
            style={
              {
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                left: `${ember.left}%`,
                bottom: "-20px",
                "--drift": `${ember.drift}px`,
                "--startY": `${ember.startY}px`,
                "--endY": `${ember.endY}px`,
                "--move1Y": `${ember.move1Y}px`,
                "--move1X": `${ember.move1X}px`,
                "--move2Y": `${ember.move2Y}px`,
                "--move2X": `${ember.move2X}px`,
                "--move3Y": `${ember.move3Y}px`,
                "--move3X": `${ember.move3X}px`,
                animationDelay: `${ember.delay}s`,
                animationDuration: `${ember.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Elegant Center Divider */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5 hidden md:block">
        <style>{`
          @keyframes line-glow {
            0%, 100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.3); }
            50% { box-shadow: 0 0 25px rgba(248, 113, 113, 0.5); }
          }
          
          .divider-line {
            width: 1px;
            height: 60vh;
            background: linear-gradient(to bottom,
              transparent 0%,
              rgba(220, 38, 38, 0.2) 15%,
              rgba(248, 113, 113, 0.6) 50%,
              rgba(185, 28, 28, 0.2) 85%,
              transparent 100%);
            animation: line-glow 4s ease-in-out infinite;
            position: relative;
          }
        `}</style>

        {/* Main Divider Line */}
        <div className="divider-line" />
      </div>

      {/* Subtle Ambient Elements */}
      <div className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none z-5">
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-gradient-to-tl from-rose-600/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Left Section - Platform Info */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-start px-8 md:px-16 py-12 md:py-16 relative z-10">
        {/* Logo Section */}
        <div className="mb-12 md:mb-16">
          <Logo size="xl" />
        </div>

        {/* Animated Tagline */}
        <div className="mb-12 md:mb-16 h-12 flex items-center">
          <p className="text-2xl md:text-3xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-red-500 transition-all duration-1000 ease-in-out tracking-wide">
            {textOptions[animatedText]}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12 md:mb-16 w-full max-w-md relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-2xl blur-xl -z-10"></div>
          
          <div className="p-5 bg-white/[0.02] backdrop-blur-sm border border-red-500/20 rounded-2xl hover:bg-white/[0.04] hover:border-red-400/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all duration-500 cursor-default group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full"></div>
            <div className="text-3xl font-bold text-red-400 mb-1 group-hover:text-red-300 transition-colors drop-shadow-sm">
              10K+
            </div>
            <div className="text-sm text-zinc-400 font-medium tracking-wide uppercase text-[10px]">
              Active Students
            </div>
          </div>
          <div className="p-5 bg-white/[0.02] backdrop-blur-sm border border-red-500/20 rounded-2xl hover:bg-white/[0.04] hover:border-red-400/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all duration-500 cursor-default group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full"></div>
            <div className="text-3xl font-bold text-red-400 mb-1 group-hover:text-red-300 transition-colors drop-shadow-sm">
              500+
            </div>
            <div className="text-sm text-zinc-400 font-medium tracking-wide uppercase text-[10px]">
              Expert Teachers
            </div>
          </div>
          <div className="p-5 bg-white/[0.02] backdrop-blur-sm border border-red-500/20 rounded-2xl hover:bg-white/[0.04] hover:border-red-400/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all duration-500 cursor-default group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full"></div>
            <div className="text-3xl font-bold text-red-400 mb-1 group-hover:text-red-300 transition-colors drop-shadow-sm">
              1M+
            </div>
            <div className="text-sm text-zinc-400 font-medium tracking-wide uppercase text-[10px]">
              Questions Attempted
            </div>
          </div>
          <div className="p-5 bg-white/[0.02] backdrop-blur-sm border border-red-500/20 rounded-2xl hover:bg-white/[0.04] hover:border-red-400/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all duration-500 cursor-default group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full"></div>
            <div className="text-3xl font-bold text-red-400 mb-1 group-hover:text-red-300 transition-colors drop-shadow-sm">
              100%
            </div>
            <div className="text-sm text-zinc-400 font-medium tracking-wide uppercase text-[10px]">Success Rate</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 w-full max-w-md">
          <div className="flex items-center gap-4 group cursor-default p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 group-hover:bg-red-500/20 group-hover:border-red-400/50 transition-all shadow-[0_0_10px_rgba(220,38,38,0.1)]">
              <div className="w-2 h-2 bg-red-400 rounded-full group-hover:shadow-[0_0_8px_rgba(248,113,113,0.8)] transition-all"></div>
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors font-light text-sm tracking-wide">
              Interactive live test series & mocks
            </span>
          </div>
          <div className="flex items-center gap-4 group cursor-default p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 group-hover:bg-red-500/20 group-hover:border-red-400/50 transition-all shadow-[0_0_10px_rgba(220,38,38,0.1)]">
              <div className="w-2 h-2 bg-red-400 rounded-full group-hover:shadow-[0_0_8px_rgba(248,113,113,0.8)] transition-all"></div>
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors font-light text-sm tracking-wide">
              Advanced analytics & performance tracking
            </span>
          </div>
          <div className="flex items-center gap-4 group cursor-default p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 group-hover:bg-red-500/20 group-hover:border-red-400/50 transition-all shadow-[0_0_10px_rgba(220,38,38,0.1)]">
              <div className="w-2 h-2 bg-red-400 rounded-full group-hover:shadow-[0_0_8px_rgba(248,113,113,0.8)] transition-all"></div>
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors font-light text-sm tracking-wide">
              Detailed step-by-step LaTeX solutions
            </span>
          </div>
          <div className="flex items-center gap-4 group cursor-default p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 group-hover:bg-red-500/20 group-hover:border-red-400/50 transition-all shadow-[0_0_10px_rgba(220,38,38,0.1)]">
              <div className="w-2 h-2 bg-red-400 rounded-full group-hover:shadow-[0_0_8px_rgba(248,113,113,0.8)] transition-all"></div>
            </div>
            <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors font-light text-sm tracking-wide">
              Direct challenge workflows with teachers
            </span>
          </div>
        </div>
      </div>

      {/* Right Section - Auth Box */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-8 md:px-12 py-16 relative z-10">
        <div className="w-full max-w-md p-8 sm:p-10 bg-transparent relative overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-black/40 p-1.5 rounded-xl border border-white/5 relative z-10">
            <button
              onClick={() => setAuthView("login")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-500 text-sm tracking-wide ${
                authView === "login"
                  ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthView("signup")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-500 text-sm tracking-wide ${
                authView === "signup"
                  ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Container */}
          <div className="relative h-[420px] z-10">
            {authView === "login" && (
              <div className="absolute inset-0 animate-in fade-in duration-500">
                <LoginFormEmbedded
                  onSwitchToSignup={() => setAuthView("signup")}
                  onSwitchToForgot={() => setAuthView("forgot-password")}
                />
              </div>
            )}
            {authView === "signup" && (
              <div className="absolute inset-0 animate-in fade-in duration-500">
                <RegisterFormEmbedded
                  onSwitchToLogin={() => setAuthView("login")}
                />
              </div>
            )}
            {authView === "forgot-password" && (
              <div className="absolute inset-0 animate-in fade-in duration-500">
                <ForgotPasswordFormEmbedded
                  onSwitchToLogin={() => setAuthView("login")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Embedded Login Form
function LoginFormEmbedded({
  onSwitchToSignup,
  onSwitchToForgot,
}: {
  onSwitchToSignup: () => void;
  onSwitchToForgot: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(email, password);
      router.push("/dashboard");
    } catch (error: any) {
      setGeneralError(
        error.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {generalError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {generalError}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${
              errors.email ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
            } text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.email ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${
                errors.password ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
              } text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.password ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors p-1"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.password}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="rounded bg-black/40 border-white/10 text-red-500 focus:ring-red-500/20 focus:ring-offset-0" />
          <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">Remember me</span>
        </label>
        <button
          type="button"
          onClick={onSwitchToForgot}
          className="text-red-500 hover:text-red-400 text-xs font-medium transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 mt-4 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
        ) : "Sign In"}
      </button>

      <div className="pt-4 text-center">
        <p className="text-zinc-400 text-xs">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-red-500 hover:text-red-400 font-medium transition-colors"
          >
            Create one now
          </button>
        </p>
      </div>
    </form>
  );
}

// Embedded Register Form
function RegisterFormEmbedded({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email || !firstName) {
      setErrors({
        email: !email ? "Email is required" : "",
        firstName: !firstName ? "First name is required" : "",
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({ email, firstName });
      setStep(2);
      setGeneralError(null);
    } catch (error: any) {
      setGeneralError(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!otp || !password) {
      setErrors({
        otp: !otp ? "OTP is required" : "",
        password: !password ? "Password is required" : "",
      });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setErrors({ otp: "OTP must be 6 digits" });
      return;
    }

    if (password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp({
        email,
        otp,
        password,
        firstName,
      });
      router.push("/dashboard");
    } catch (error: any) {
      setGeneralError(error.response?.data?.message || "Verification failed");
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={step === 1 ? handleStep1 : handleStep2}
      className="space-y-5"
    >

      {generalError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {generalError}
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Alex"
              className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${
                errors.firstName ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
              } text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.firstName ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
            />
            {errors.firstName && (
              <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${
                errors.email ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
              } text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.email ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-6 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? "Sending OTP..." : "Continue"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider text-center">
              Enter 6-Digit OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              maxLength={6}
              className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${
                errors.otp ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
              } text-white text-center text-3xl tracking-[0.5em] placeholder-zinc-700 font-mono focus:outline-none focus:ring-1 ${errors.otp ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
            />
            {errors.otp && (
              <p className="text-red-400 text-xs mt-1.5 text-center">{errors.otp}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider mt-4">
              Create Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${
                  errors.password ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
                } text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.password ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors p-1"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.password}</p>
            )}
            <p className="text-[10px] text-zinc-500 mt-1.5 ml-1">Must be at least 8 characters long</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-6 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? "Verifying..." : "Verify & Create Account"}
          </button>
          
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-zinc-400 hover:text-white text-xs font-medium transition-colors mt-2"
          >
            Back to previous step
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="pt-4 text-center border-t border-white/5 mt-4">
          <p className="text-zinc-400 text-xs">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-red-500 hover:text-red-400 font-medium transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      )}
    </form>
  );
}

// Embedded Forgot Password Form
function ForgotPasswordFormEmbedded({
  onSwitchToLogin,
}: {
  onSwitchToLogin: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSubmitted(true);
      setGeneralError(null);
    } catch (error: any) {
      setGeneralError(
        error.response?.data?.message || "Failed to send reset link",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center py-10">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="mt-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
          <p className="text-zinc-400 text-sm">
            We've sent a password reset link to <br/>
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all duration-300 text-sm"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {generalError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {generalError}
        </div>
      )}

      <div>
        <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${
            errors.email ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
          } text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.email ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 mt-6 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {isLoading ? "Sending Link..." : "Send Reset Link"}
      </button>

      <div className="pt-4 text-center border-t border-white/5 mt-4">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
        >
          ← Back to Sign In
        </button>
      </div>
    </form>
  );
}
