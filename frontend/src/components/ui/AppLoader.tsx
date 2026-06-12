import React from "react";
import Logo from "./Logo";

export default function AppLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent">
      <div className="relative flex flex-col items-center justify-center animate-pulse duration-1000">
        <Logo size="lg" className="mb-8" />
        
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-red-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-rose-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          <div className="absolute inset-4 rounded-full border-t-2 border-white/20 animate-spin" style={{ animationDuration: '2s' }} />
        </div>
      </div>
      <p className="mt-6 text-sm font-medium tracking-widest text-zinc-500 uppercase animate-pulse">
        Initializing Workspace
      </p>
    </div>
  );
}
