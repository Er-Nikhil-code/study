"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Quicksand, Caveat } from "next/font/google";
import { authService } from "@/services/auth.service";
import { useAuthStore, AuthUser } from "@/store/auth.store";
import Logo from "@/components/ui/Logo";

const caveat = Caveat({ subsets: ["latin"], weight: ["700"] });

const QUOTES = [
  { greeting: "“Never let the future disturb you.”", body: "— Marcus Aurelius" },
  { greeting: "“Education is the manifestation of the perfection already in man.”", body: "— Swami Vivekananda" },
  { greeting: "“Learning without thought is labor lost; thought without learning is perilous.”", body: "— Confucius" },
  { greeting: "“Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.”", body: "— A. P. J. Abdul Kalam" },
  { greeting: "“The beginning is the most important part of any work.”", body: "— Plato" },
  { greeting: "“Satisfaction lies in the effort, not in the attainment.”", body: "— Mahatma Gandhi" },
  { greeting: "“Take up one idea. Make that one idea your life.”", body: "— Swami Vivekananda" },
  { greeting: "“It is not that we have a short space of time, but that we waste much of it.”", body: "— Seneca" },
  { greeting: "“Knowledge without practice is useless. Practice without knowledge is dangerous.”", body: "— Chanakya" },
  { greeting: "“The mind is the friend of one who has conquered it, and the enemy of one who has failed to do so.”", body: "— Bhagavad Gita (Lord Krishna)" },
  { greeting: "“Excellence happens not by accident. It is a process.”", body: "— A. P. J. Abdul Kalam" },
  { greeting: "“Those who cannot remember the past are condemned to repeat it.”", body: "— George Santayana" },
  { greeting: "“Strength is life; weakness is death.”", body: "— Swami Vivekananda" },
  { greeting: "“Learning is a kind of natural food for the mind.”", body: "— Cicero" },
  { greeting: "“Anyone who holds a true opinion without understanding is like a blind man on the right road.”", body: "— Plato" },
  { greeting: "“Arise, awake, and stop not till the goal is reached.”", body: "— Swami Vivekananda" },
  { greeting: "“While we are postponing, life speeds by.”", body: "— Seneca" },
  { greeting: "“A person is made by their faith; whatever their faith is, that they become.”", body: "— Bhagavad Gita (Lord Krishna)" },
  { greeting: "“Before you start some work, always ask yourself three questions: Why am I doing it? What the results might be? Will I be successful?”", body: "— Chanakya" },
  { greeting: "“Truth gains more even by the errors…”", body: "— John Stuart Mill" },
  { greeting: "“Live as if you were to die tomorrow. Learn as if you were to live forever.”", body: "— Mahatma Gandhi" },
  { greeting: "“Pass through this short time in an orderly way.”", body: "— Marcus Aurelius" },
  { greeting: "“Much learning does not teach understanding.”", body: "— Heraclitus" },
  { greeting: "“To succeed in your mission, you must have single-minded devotion to your goal.”", body: "— A. P. J. Abdul Kalam" },
  { greeting: "“Let a man lift himself by himself; let him not degrade himself.”", body: "— Bhagavad Gita (Lord Krishna)" },
  { greeting: "“The best way to find yourself is to lose yourself in the service of others.”", body: "— Mahatma Gandhi" },
  { greeting: "“All power is within you; you can do anything and everything.”", body: "— Swami Vivekananda" },
  { greeting: "“Man needs difficulties in life because they are necessary to enjoy success.”", body: "— A. P. J. Abdul Kalam" },
  { greeting: "“Learning gives creativity, creativity leads to thinking, thinking provides knowledge, knowledge makes you great.”", body: "— A. P. J. Abdul Kalam" },
  { greeting: "“It does not matter how slowly you go so long as you do not stop.”", body: "— Confucius" },
  { greeting: "“While thou livest, while thou hast time, be good.”", body: "— Marcus Aurelius" },
  { greeting: "“A person should not be too honest. Straight trees are cut first and honest people are screwed first.”", body: "— Chanakya" }
];

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500"]
});

// Main Home Page Component
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

  const [authView, setAuthView] = useState<
    "login" | "signup" | "forgot-password"
  >("login");



  // Alien typing state
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [displayedGreeting, setDisplayedGreeting] = useState("");
  const [displayedBody, setDisplayedBody] = useState("");
  const [phase, setPhase] = useState<"typing-greeting" | "typing-body" | "holding" | "fading">("typing-greeting");
  const [opacity, setOpacity] = useState(1);
  const charIndexRef = useRef(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
    setIsMounted(true);
  }, []);

  // Alien typing effect
  useEffect(() => {
    if (!isMounted) return;

    const quote = QUOTES[quoteIndex];

    if (phase === "typing-greeting") {
      if (charIndexRef.current < quote.greeting.length) {
        const timer = setTimeout(() => {
          setDisplayedGreeting(quote.greeting.slice(0, charIndexRef.current + 1));
          charIndexRef.current++;
        }, 30); // smooth, elegant typing speed
        return () => clearTimeout(timer);
      } else {
        charIndexRef.current = 0;
        setPhase("typing-body");
      }
    }

    if (phase === "typing-body") {
      if (charIndexRef.current < quote.body.length) {
        const timer = setTimeout(() => {
          setDisplayedBody(quote.body.slice(0, charIndexRef.current + 1));
          charIndexRef.current++;
        }, 15); // slightly faster for body text
        return () => clearTimeout(timer);
      } else {
        charIndexRef.current = 0;
        setPhase("holding");
      }
    }

    if (phase === "holding") {
      const timer = setTimeout(() => setPhase("fading"), 4000);
      return () => clearTimeout(timer);
    }

    if (phase === "fading") {
      setOpacity(0);
      const timer = setTimeout(() => {
        setDisplayedGreeting("");
        setDisplayedBody("");
        charIndexRef.current = 0;
        setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
        setOpacity(1);
        setPhase("typing-greeting");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, quoteIndex, displayedGreeting, displayedBody, isMounted]);

  // Embers - reduced for perf
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

  useEffect(() => {
    const baseWind = 150;
    const generatedEmbers = [...Array(30)].map((_, i) => {
      const randomWind = (Math.random() - 0.5) * 400;
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 5 + Math.random() * 12,
        drift: baseWind + randomWind,
        move1Y: -100 - Math.random() * 200,
        move1X: (Math.random() - 0.5) * 150 + baseWind * 0.3,
        move2Y: -300 - Math.random() * 300,
        move2X: (Math.random() - 0.5) * 250 + baseWind * 0.6,
        move3Y: -600 - Math.random() * 400,
        move3X: (Math.random() - 0.5) * 350 + baseWind * 0.8,
        startY: 50 + Math.random() * 100,
        endY: -1000 - Math.random() * 500,
        size: Math.random() * 4 + 1,
      };
    });
    setEmbers(generatedEmbers);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row items-center justify-center overflow-x-hidden overflow-y-auto md:overflow-hidden relative">
      {/* Animated Background */}
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
            0% { transform: translateY(var(--startY, 0px)) translateX(0px) scale(1); opacity: 0; }
            10% { opacity: 0.9; }
            25% { transform: translateY(var(--move1Y, -40px)) translateX(var(--move1X, 50px)) scale(0.95); opacity: 0.6; }
            35% { opacity: 1; }
            50% { transform: translateY(var(--move2Y, -80px)) translateX(var(--move2X, -40px)) scale(1.1); opacity: 0.4; }
            65% { opacity: 0.8; }
            75% { transform: translateY(var(--move3Y, -120px)) translateX(var(--move3X, 60px)) scale(0.9); opacity: 0.2; }
            90% { opacity: 0.5; }
            100% { transform: translateY(var(--endY, -150px)) translateX(var(--drift, 0px)) scale(0.3); opacity: 0; }
          }
          @keyframes ember-glow {
            0%, 100% { box-shadow: 0 0 5px rgba(249, 115, 22, 0.8), 0 0 15px rgba(249, 115, 22, 0.5); opacity: 0.8; }
            30% { box-shadow: 0 0 10px rgba(249, 115, 22, 1), 0 0 25px rgba(249, 115, 22, 0.8), 0 0 40px rgba(220, 38, 38, 0.6); opacity: 1; }
            70% { box-shadow: 0 0 4px rgba(249, 115, 22, 0.6), 0 0 10px rgba(249, 115, 22, 0.3); opacity: 0.7; }
          }
          .bg-float-1 {
            position: absolute; width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%);
            border-radius: 50%; filter: blur(80px);
            animation: float-shape-1 12s ease-in-out infinite;
            top: -150px; right: -100px;
          }
          .bg-float-2 {
            position: absolute; width: 600px; height: 600px;
            background: radial-gradient(circle, rgba(185, 28, 28, 0.25) 0%, transparent 70%);
            border-radius: 50%; filter: blur(100px);
            animation: float-shape-2 15s ease-in-out infinite;
            bottom: -200px; left: -150px;
          }
          .bg-pulse {
            position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.04) 0%, transparent 50%, rgba(185, 28, 28, 0.03) 100%);
            animation: pulse-subtle 6s ease-in-out infinite;
          }
          @keyframes ambient-glow {
            0%, 100% { opacity: 0.1; }
            50% { opacity: 0.18; }
          }
          .ambient-fire {
            position: absolute; inset: 0;
            background: radial-gradient(ellipse at 50% 50%, rgba(248, 113, 113, 0.12) 0%, rgba(220, 38, 38, 0.06) 30%, transparent 70%);
            animation: ambient-glow 8s ease-in-out infinite;
            pointer-events: none;
          }
          @keyframes bottom-glow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.45; }
          }
          .bottom-ambient-glow {
            position: absolute; bottom: 0; left: 0; right: 0; height: 300px;
            background: linear-gradient(to top, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.15) 40%, transparent 100%);
            animation: bottom-glow 6s ease-in-out infinite;
            pointer-events: none;
          }
          .ember {
            position: absolute; border-radius: 50%;
            background: radial-gradient(circle at 40% 40%, rgba(220, 38, 38, 0.95) 0%, rgba(239, 68, 68, 0.8) 20%, rgba(249, 115, 22, 0.6) 60%, rgba(249, 115, 22, 0.1) 100%);
            animation: ember-roam linear infinite;
            mix-blend-mode: screen;
          }
          .ember::before {
            content: ''; position: absolute; width: 100%; height: 100%;
            background: transparent; border-radius: 50%;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
            animation: ember-glow 3s ease-in-out infinite;
            mix-blend-mode: screen;
          }
          @keyframes cursor-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .elegant-cursor {
            display: inline-block;
            width: 2px;
            height: 1.1em;
            background: rgba(255, 255, 255, 0.7);
            margin-left: 4px;
            vertical-align: text-bottom;
            animation: cursor-blink 1s step-end infinite;
            border-radius: 2px;
          }
        `}</style>

        <div className="bg-float-1" />
        <div className="bg-float-2" />
        <div className="bg-pulse" />
        <div className="ambient-fire" />
        <div className="bottom-ambient-glow" />

        {embers.map((ember, index) => (
          <div
            key={ember.id}
            className={`ember ${index % 3 !== 0 ? 'hidden md:block' : ''}`}
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

      {/* Center Divider */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-5 hidden md:block">
        <style>{`
          @keyframes line-glow {
            0%, 100% { box-shadow: 0 0 15px rgba(220, 38, 38, 0.3); }
            50% { box-shadow: 0 0 25px rgba(248, 113, 113, 0.5); }
          }
          .divider-line {
            width: 1px; height: 60vh;
            background: linear-gradient(to bottom,
              transparent 0%, rgba(220, 38, 38, 0.2) 15%,
              rgba(248, 113, 113, 0.6) 50%,
              rgba(185, 28, 28, 0.2) 85%, transparent 100%);
            animation: line-glow 4s ease-in-out infinite;
          }
        `}</style>
        <div className="divider-line" />
      </div>

      {/* Subtle Ambient */}
      <div className="absolute right-0 top-0 bottom-0 w-96 pointer-events-none z-5">
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-3xl hidden" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-gradient-to-tl from-rose-600/10 to-transparent rounded-full blur-3xl hidden" style={{ animationDuration: '6s' }} />
      </div>

      {/* Left Section - Alien Typed Quotes */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-start px-8 md:px-16 py-12 md:py-16 relative z-10">
        {/* Premium Minimalist Logo */}
        <div className="mb-10 md:mb-14 relative cursor-default">
          <div className="relative transform">
            <h1 className={`text-5xl md:text-7xl tracking-[0.15em] uppercase flex items-center pr-4 pb-2 z-10 ${quicksand.className} relative`}>
              <span className="text-red-600 drop-shadow-[0_1px_4px_rgba(220,38,38,0.5)]">
                C
              </span>
              <span className="text-white drop-shadow-md">
                ODIFY
              </span>
              <span className={`absolute -right-3 md:-right-6 -bottom-2 md:bottom-1 text-xl md:text-3xl text-red-500 tracking-normal lowercase -rotate-12 drop-shadow-lg ${caveat.className}`}>
                today
              </span>
            </h1>

            {/* Minimal static underline */}
            <div className="relative mt-4 h-[3px] w-16 rounded-full bg-gradient-to-r from-red-600 to-red-800 shadow-sm opacity-80"></div>

            <p className="text-zinc-400 text-xs md:text-sm mt-4 tracking-[0.2em] font-light uppercase flex items-center gap-3 opacity-70">
              Learn smarter
              <span className="h-1 w-1 rounded-full bg-red-600 opacity-60"></span>
              Score higher
            </p>
          </div>
        </div>

        {/* Elegant Typed Quote */}
        <div
          className="min-h-[200px] md:min-h-[240px] w-full max-w-lg mt-4"
          style={{ opacity, transition: "opacity 0.8s ease-in-out" }}
        >
          <h2 className={`text-sm md:text-base font-medium leading-snug mb-3 ${quicksand.className}`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-400">
              {displayedGreeting}
            </span>
            {phase === "typing-greeting" && <span className="elegant-cursor" />}
          </h2>
          <p className="text-[9px] md:text-[10px] leading-relaxed font-semibold tracking-[0.15em] text-red-500/80 uppercase">
            {displayedBody}
            {phase === "typing-body" && <span className="elegant-cursor" />}
          </p>
        </div>

        {/* Minimalist accent line */}
        <div className="mt-8 flex items-center gap-3 opacity-40">
          <div className="h-px w-12 bg-gradient-to-r from-red-500 to-transparent" />
          <span className="text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-medium">codify.today</span>
          <div className="h-px w-12 bg-gradient-to-l from-red-500 to-transparent" />
        </div>
      </div>

      {/* Right Section - Auth Box */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-8 md:px-12 py-16 relative z-10">
        <div className="w-full max-w-md p-8 sm:p-10 relative overflow-hidden">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-black/60 p-1.5 rounded-xl border border-white/10 relative z-10 shadow-inner">
            <button
              onClick={() => setAuthView("login")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-500 text-sm tracking-wide ${authView === "login"
                ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthView("signup")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all duration-500 text-sm tracking-wide ${authView === "signup"
                ? "bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Container */}
          <div className="relative min-h-[420px] z-10">
            {authView === "login" && (
              <div className="absolute inset-0 animate-in fade-in duration-500">
                <LoginFormEmbedded
                  onSwitchToSignup={() => setAuthView("signup")}
                  onSwitchToForgot={() => setAuthView("forgot-password")}
                />
              </div>
            )}
            {authView === "signup" && (
              <div className="relative animate-in fade-in duration-500 w-full h-full pb-6">
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
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
      const res = await authService.login(email, password, rememberMe);

      // Update Zustand store so Navbar and all components see the user immediately
      if (res.user && res.accessToken) {
        setAuth(res.user as AuthUser, res.accessToken);
      }

      const role = res.user?.role || "STUDENT";
      if (role === "ADMIN") router.push("/admin");
      else if (role === "TEACHER") router.push("/teacher");
      else if (role === "INTERN") router.push("/intern/dashboard");
      else router.push("/student/dashboard");
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
            placeholder="Email address"
            className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${errors.email ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
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
              placeholder="Password"
              className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${errors.password ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
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
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="rounded bg-black/40 border-white/10 text-red-500 focus:ring-red-500/20 focus:ring-offset-0" />
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
          "Signing in..."
        ) : (
          "Sign In"
        )}
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
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  const handleSendOtp = async () => {
    setErrors({});
    if (!email || !firstName) {
      setErrors({
        email: !email ? "Email is required" : "",
        firstName: !firstName ? "First name is required" : "",
      });
      return;
    }

    setIsLoading(true);
    setGeneralError(null);
    try {
      const response = await authService.register({ email, firstName, lastName: lastName || undefined });
      setMaskedEmail(response.email_masked);
      setShowOtpModal(true);
    } catch (error: any) {
      setGeneralError(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || !/^\d{6}$/.test(otp)) {
      setErrors({ otp: "OTP must be 6 digits" });
      return;
    }

    setIsLoading(true);
    setGeneralError(null);

    try {
      await authService.verifyOtpCode(email, otp);
      setIsOtpVerified(true);
      setShowOtpModal(false);
    } catch (error: any) {
      setGeneralError(error.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!isOtpVerified) return;

    if (!password || password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setIsLoading(true);
    setGeneralError(null);

    try {
      const res = await authService.verifyOtp({
        email,
        otp,
        password,
        firstName,
        lastName: lastName || undefined,
      });

      if (res.user && res.accessToken) {
        setAuth(res.user as AuthUser, res.accessToken);
      }

      const role = res.user?.role || "STUDENT";
      if (role === "ADMIN") router.push("/admin");
      else if (role === "TEACHER") router.push("/teacher");
      else if (role === "INTERN") router.push("/intern/dashboard");
      else router.push("/student/dashboard");
    } catch (error: any) {
      setGeneralError(error.response?.data?.message || "Failed to create account");
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleCreateAccount} className="space-y-4 relative z-10">

        {generalError && !showOtpModal && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {generalError}
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            disabled={isOtpVerified || isLoading}
            className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${errors.firstName ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"} text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.firstName ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all disabled:opacity-50`}
          />
          {errors.firstName && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name (Optional)"
            disabled={isOtpVerified || isLoading}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
            Email Address
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsOtpVerified(false);
              }}
              placeholder="Email address"
              disabled={isOtpVerified || isLoading}
              className={`flex-1 min-w-0 px-4 py-3 rounded-xl bg-black/40 border ${errors.email ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"} text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.email ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all disabled:opacity-50`}
            />

            {isOtpVerified ? (
              <div className="flex items-center justify-center px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading || !email}
                className="whitespace-nowrap px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold uppercase tracking-wider rounded-xl transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {isLoading && !showOtpModal ? "Sending..." : "Send OTP"}
              </button>
            )}
          </div>
          {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>}
        </div>

        {/* Password Fields appear after OTP */}
        {isOtpVerified && (
          <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${errors.password ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"} text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.password ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors p-1"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${errors.confirmPassword ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"} text-white placeholder-zinc-600 focus:outline-none focus:ring-1 ${errors.confirmPassword ? "focus:ring-red-500/20" : "focus:ring-red-500/20"} transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-red-400 text-xs font-medium transition-colors p-1"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-6 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        )}

        {!isOtpVerified && (
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

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.1)] relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Verify Email</h2>
              <p className="text-xs text-zinc-400">
                We've sent a 6-digit code to <br />
                <span className="font-medium text-white">{maskedEmail}</span>
              </p>
            </div>

            {generalError && showOtpModal && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {generalError}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full px-4 py-4 text-center text-4xl tracking-[0.3em] font-mono border-2 rounded-2xl bg-black/40 border-white/10 text-white placeholder-zinc-800 focus:outline-none focus:border-red-500/50 focus:shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all"
                  autoFocus
                />
                {errors.otp && <p className="text-red-400 text-xs mt-2 text-center">{errors.otp}</p>}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    handleSendOtp();
                  }}
                  className="text-[11px] text-zinc-500 hover:text-white transition-colors"
                >
                  Didn't receive the code? <span className="text-red-400 underline">Resend</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
            We've sent a password reset link to <br />
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
          placeholder="Email address"
          className={`w-full px-4 py-3 rounded-xl bg-black/40 border ${errors.email ? "border-red-500/50 focus:border-red-500/50" : "border-white/10 focus:border-red-500/50"
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
