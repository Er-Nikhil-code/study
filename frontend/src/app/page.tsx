"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authService } from "@/services/auth.service";

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
    }>
  >([]);

  const textOptions = [
    "Master Your Learning",
    "Teach with Confidence",
    "Build Your Future",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedText((prev) => (prev + 1) % textOptions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate embers only on client side to avoid hydration mismatch
    const generatedEmbers = [...Array(25)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: (i * 0.4) % 10,
      duration: 8 + Math.random() * 6,
      drift: (Math.random() - 0.5) * 200,
      move1Y: -200 + Math.random() * 100,
      move1X: (Math.random() - 0.5) * 150,
      move2Y: -500 + Math.random() * 150,
      move2X: (Math.random() - 0.5) * 200,
      move3Y: -800 + Math.random() * 200,
      move3X: (Math.random() - 0.5) * 250,
      startY: -100 - Math.random() * 50,
      endY: -1200 - Math.random() * 300,
    }));
    setEmbers(generatedEmbers);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-row items-center justify-center overflow-hidden relative">
      {/* Minimalist Animated Background */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none z-20"
        suppressHydrationWarning
      >
        <style>{`
          @keyframes float-shape-1 {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.15; }
            50% { transform: translateY(-30px) translateX(20px); opacity: 0.08; }
          }
          
          @keyframes float-shape-2 {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.1; }
            50% { transform: translateY(40px) translateX(-20px); opacity: 0.05; }
          }
          
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes pulse-subtle {
            0%, 100% { opacity: 0.08; }
            50% { opacity: 0.15; }
          }
          
          @keyframes ember-float {
            0% { transform: translateY(0px) translateX(0px); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.3; }
            100% { transform: translateY(-150px) translateX(var(--drift, 0px)); opacity: 0; }
          }
          
          @keyframes ember-roam {
            0% { 
              transform: translateY(var(--startY, 0px)) translateX(0px) scale(1);
              opacity: 0.6;
            }
            2% { 
              opacity: 0.7;
            }
            25% { 
              transform: translateY(var(--move1Y, -40px)) translateX(var(--move1X, 50px)) scale(0.95);
              opacity: 0.6;
            }
            50% { 
              transform: translateY(var(--move2Y, -80px)) translateX(var(--move2X, -40px)) scale(1);
              opacity: 0.5;
            }
            75% { 
              transform: translateY(var(--move3Y, -120px)) translateX(var(--move3X, 60px)) scale(0.9);
              opacity: 0.4;
            }
            95% { 
              opacity: 0.1;
            }
            100% { 
              transform: translateY(var(--endY, -150px)) translateX(var(--drift, 0px)) scale(0.5);
              opacity: 0;
            }
          }
          
          @keyframes ember-glow {
            0%, 100% { box-shadow: 0 0 4px rgba(220, 38, 38, 0.8), 0 0 12px rgba(220, 38, 38, 0.4); }
            50% { box-shadow: 0 0 6px rgba(220, 38, 38, 1), 0 0 16px rgba(220, 38, 38, 0.6); }
          }
          
          .bg-float-1 {
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, transparent 70%);
            border-radius: 50%;
            filter: blur(80px);
            animation: float-shape-1 8s ease-in-out infinite;
            top: -100px;
            right: -100px;
          }
          
          .bg-float-2 {
            position: absolute;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            filter: blur(100px);
            animation: float-shape-2 10s ease-in-out infinite;
            bottom: -150px;
            left: -150px;
          }
          
          .bg-pulse {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.03) 0%, transparent 50%, rgba(220, 38, 38, 0.02) 100%);
            animation: pulse-subtle 4s ease-in-out infinite;
          }
          
          @keyframes ambient-glow {
            0%, 100% { opacity: 0.12; }
            50% { opacity: 0.18; }
          }
          
          .ambient-fire {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at 50% 50%, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.08) 30%, transparent 70%);
            animation: ambient-glow 6s ease-in-out infinite;
            pointer-events: none;
          }
          
          @keyframes ambient-glow-2 {
            0%, 100% { opacity: 0.08; }
            50% { opacity: 0.14; }
          }
          
          .ambient-fire-2 {
            position: absolute;
            inset: 0;
            background: 
              radial-gradient(ellipse 800px 400px at 20% 30%, rgba(220, 38, 38, 0.12) 0%, transparent 40%),
              radial-gradient(ellipse 600px 500px at 80% 70%, rgba(220, 38, 38, 0.1) 0%, transparent 50%);
            animation: ambient-glow-2 8s ease-in-out infinite;
            pointer-events: none;
          }
          
          .ember {
            position: absolute;
            width: 3px;
            height: 3px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.9), rgba(220, 38, 38, 0.4));
            animation: ember-roam linear infinite;
            animation-play-state: running;
          }
          
          .ember::before {
            content: '';
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(220, 38, 38, 0.7);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: ember-glow 1.5s ease-in-out infinite;
          }
          
          @keyframes bottom-glow {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.5; }
          }
          
          .bottom-ambient-glow {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 250px;
            background: linear-gradient(to top, rgba(220, 38, 38, 0.4) 0%, rgba(220, 38, 38, 0.25) 40%, transparent 100%);
            animation: bottom-glow 5s ease-in-out infinite;
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

        {/* Secondary ambient fire glow */}
        <div className="ambient-fire-2" />

        {/* Bottom ambient glow */}
        <div className="bottom-ambient-glow" />

        {/* Fire Embers - scattered across screen */}
        {embers.map((ember) => (
          <div
            key={ember.id}
            className="ember"
            style={
              {
                left: `${ember.left}%`,
                bottom: "0px",
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
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5">
        <style>{`
          @keyframes line-glow {
            0%, 100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.4); }
            50% { box-shadow: 0 0 25px rgba(220, 38, 38, 0.6); }
          }
          
          .divider-line {
            width: 1px;
            height: 500px;
            background: linear-gradient(to bottom,
              transparent 0%,
              rgba(220, 38, 38, 0.3) 15%,
              rgba(220, 38, 38, 0.5) 50%,
              rgba(220, 38, 38, 0.3) 85%,
              transparent 100%);
            animation: line-glow 3s ease-in-out infinite;
            position: relative;
          }
          
          @keyframes accent-float {
            0%, 100% { transform: translateY(0px); opacity: 0.15; }
            50% { transform: translateY(-8px); opacity: 0.25; }
          }
          
          .accent-line {
            position: absolute;
            width: 1px;
            height: 60px;
            background: linear-gradient(to bottom, rgba(220, 38, 38, 0.6), transparent);
            animation: accent-float 3s ease-in-out infinite;
          }
          
          .accent-1 {
            display: none;
          }
          
          .accent-2 {
            display: none;
          }
          
          .accent-3 {
            display: none;
          }
        `}</style>

        {/* Main Divider Line */}
        <div className="divider-line" />

        {/* Accent Lines */}
        <div className="accent-line accent-1" />
        <div className="accent-line accent-2" />
        <div className="accent-line accent-3" />
      </div>

      {/* Subtle Ambient Elements */}
      <div className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none z-5">
        <style>{`
          @keyframes subtle-shimmer {
            0%, 100% { opacity: 0.08; }
            50% { opacity: 0.15; }
          }
          
          .ambient-shimmer {
            position: absolute;
            width: 2px;
            animation: subtle-shimmer 4s ease-in-out infinite;
          }
        `}</style>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-br from-red-600/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-gradient-to-tl from-red-600/8 to-transparent rounded-full blur-2xl" />
      </div>
      {/* Left Section - Platform Info */}
      <div className="w-1/2 flex flex-col justify-center items-start px-12 py-16 relative z-10">
        {/* Logo Section */}
        <div className="mb-16">
          <h1 className="text-7xl font-bold mb-4">
            <span className="text-white">Study</span>
            <span className="text-red-600 ml-3">Platform</span>
          </h1>
          <div className="h-1.5 w-24 bg-gradient-to-r from-red-600 to-red-500 rounded-full"></div>
        </div>

        {/* Animated Tagline */}
        <div className="mb-16 h-12 flex items-center">
          <p className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700 ease-in-out">
            {textOptions[animatedText]}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-16 w-full max-w-md">
          <div className="p-5 bg-red-950/20 border border-red-700/30 rounded-xl hover:bg-red-950/30 hover:border-red-700/50 transition-all duration-300 cursor-default group">
            <div className="text-3xl font-bold text-red-500 mb-1 group-hover:text-red-400 transition-colors">
              10K+
            </div>
            <div className="text-sm text-gray-400 font-light">
              Active Students
            </div>
          </div>
          <div className="p-5 bg-red-950/20 border border-red-700/30 rounded-xl hover:bg-red-950/30 hover:border-red-700/50 transition-all duration-300 cursor-default group">
            <div className="text-3xl font-bold text-red-500 mb-1 group-hover:text-red-400 transition-colors">
              500+
            </div>
            <div className="text-sm text-gray-400 font-light">
              Expert Teachers
            </div>
          </div>
          <div className="p-5 bg-red-950/20 border border-red-700/30 rounded-xl hover:bg-red-950/30 hover:border-red-700/50 transition-all duration-300 cursor-default group">
            <div className="text-3xl font-bold text-red-500 mb-1 group-hover:text-red-400 transition-colors">
              1K+
            </div>
            <div className="text-sm text-gray-400 font-light">
              Learning Hours
            </div>
          </div>
          <div className="p-5 bg-red-950/20 border border-red-700/30 rounded-xl hover:bg-red-950/30 hover:border-red-700/50 transition-all duration-300 cursor-default group">
            <div className="text-3xl font-bold text-red-500 mb-1 group-hover:text-red-400 transition-colors">
              100%
            </div>
            <div className="text-sm text-gray-400 font-light">Success Rate</div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4 w-full max-w-md">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-2 h-2 bg-red-600 rounded-full group-hover:bg-red-500 transition-colors"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors font-light">
              Interactive quizzes and practice tests
            </span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-2 h-2 bg-red-600 rounded-full group-hover:bg-red-500 transition-colors"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors font-light">
              Personalized learning paths
            </span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-2 h-2 bg-red-600 rounded-full group-hover:bg-red-500 transition-colors"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors font-light">
              Collaborate with expert teachers
            </span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-2 h-2 bg-red-600 rounded-full group-hover:bg-red-500 transition-colors"></div>
            <span className="text-gray-300 group-hover:text-white transition-colors font-light">
              Track progress and achievements
            </span>
          </div>
        </div>
      </div>

      {/* Right Section - Auth Box */}
      <div className="w-1/2 flex items-center justify-center px-12 py-16 relative z-10">
        <div className="w-full max-w-sm p-10">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-black/30 p-1.5 rounded-lg border border-red-700/20">
            <button
              onClick={() => setAuthView("login")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${
                authView === "login"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthView("signup")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-300 ${
                authView === "signup"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Container */}
          <div className="relative h-96">
            {authView === "login" && (
              <div className="absolute inset-0 animate-in fade-in duration-300">
                <LoginFormEmbedded
                  onSwitchToSignup={() => setAuthView("signup")}
                  onSwitchToForgot={() => setAuthView("forgot-password")}
                />
              </div>
            )}
            {authView === "signup" && (
              <div className="absolute inset-0 animate-in fade-in duration-300">
                <RegisterFormEmbedded
                  onSwitchToLogin={() => setAuthView("login")}
                />
              </div>
            )}
            {authView === "forgot-password" && (
              <div className="absolute inset-0 animate-in fade-in duration-300">
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {generalError && (
        <div className="p-3 bg-red-600/10 border border-red-600/30 text-red-400 rounded-lg text-sm">
          {generalError}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border ${
            errors.email ? "border-red-500/50" : "border-slate-600/30"
          } text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all`}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border ${
              errors.password ? "border-red-500/50" : "border-slate-600/30"
            } text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300 text-xs font-medium"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-400 text-xs mt-1">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>

      <div className="pt-4 space-y-3 border-t border-slate-700/30">
        <button
          type="button"
          onClick={onSwitchToForgot}
          className="w-full text-red-500 hover:text-red-400 text-xs font-medium transition-colors"
        >
          Forgot password?
        </button>
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="w-full text-gray-400 hover:text-gray-300 text-xs transition-colors"
        >
          Don't have an account?{" "}
          <span className="text-red-500 font-medium">Sign up</span>
        </button>
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

    // Step 1: Only validate email and firstName (no password yet)
    if (!email || !firstName) {
      setErrors({
        email: !email ? "Email is required" : "",
        firstName: !firstName ? "First name is required" : "",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Send only email and firstName
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

    // Step 2: Validate OTP and password
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
      // Step 2: Send email, OTP, password, and other details
      await authService.verifyOtp({
        email,
        otp,
        password,
        firstName,
        role: "STUDENT",
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
        <div className="p-3 bg-red-600/10 border border-red-600/30 text-red-400 rounded-lg text-sm">
          {generalError}
        </div>
      )}

      {step === 1 ? (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all"
            />
            {errors.firstName && (
              <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 text-sm"
          >
            {isLoading ? "Sending OTP..." : "Continue"}
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-400 text-sm text-center">
            Check your email for the OTP code
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 text-white text-center text-2xl tracking-widest placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all"
            />
            {errors.otp && (
              <p className="text-red-400 text-xs mt-1">{errors.otp}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border ${
                  errors.password ? "border-red-500/50" : "border-slate-600/30"
                } text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300 text-xs font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 text-sm"
          >
            {isLoading ? "Verifying..." : "Verify & Create Account"}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full text-red-500 hover:text-red-400 text-xs font-medium transition-colors"
      >
        Back to Sign In
      </button>
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
      <div className="space-y-4 text-center py-6">
        <div className="w-12 h-12 bg-red-600/10 border border-red-600/30 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-medium mb-1">Check your email</h3>
          <p className="text-gray-400 text-sm">
            We've sent a password reset link to {email}
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 text-sm"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {generalError && (
        <div className="p-3 bg-red-600/10 border border-red-600/30 text-red-400 rounded-lg text-sm">
          {generalError}
        </div>
      )}

      <p className="text-gray-400 text-sm">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border ${
            errors.email ? "border-red-500/50" : "border-slate-600/30"
          } text-white placeholder-slate-500 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/20 transition-all`}
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 text-sm"
      >
        {isLoading ? "Sending..." : "Send Reset Link"}
      </button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="w-full text-red-500 hover:text-red-400 text-xs font-medium transition-colors"
      >
        Back to Sign In
      </button>
    </form>
  );
}
