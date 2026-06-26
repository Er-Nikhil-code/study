import { RegisterForm } from "@/components/RegisterForm";
import Logo from "@/components/ui/Logo";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Animated Background matching homepage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-150px] right-[-100px] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute bottom-[-200px] left-[-150px] w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size="lg" />
          </Link>
        </div>
        <div className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] p-8 sm:p-10">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
