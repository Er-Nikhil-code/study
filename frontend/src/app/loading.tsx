import Logo from "@/components/ui/Logo";

export default function Loading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-6">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing rings */}
        <div className="absolute h-32 w-32 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border-4 border-red-500/20"></div>
        <div className="absolute h-40 w-40 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border-2 border-red-500/10"></div>
        
        {/* Bouncing Logo */}
        <div className="animate-bounce">
          <Logo size="lg" />
        </div>
      </div>
      <div className="flex flex-col items-center text-center">
        <p className="text-lg font-medium tracking-widest text-zinc-300">
          LOADING
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Preparing your workspace...
        </p>
      </div>
    </div>
  );
}
