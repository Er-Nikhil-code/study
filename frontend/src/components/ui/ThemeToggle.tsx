"use client";

import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  themeMode: "dark" | "light";
  onChange: (mode: "dark" | "light") => void;
}

export default function ThemeToggle({ themeMode, onChange }: ThemeToggleProps) {
  const isLight = themeMode === "light";
  
  return (
    <button
      type="button"
      onClick={() => onChange(isLight ? "dark" : "light")}
      className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${
        isLight ? 'bg-white border border-zinc-200 shadow-sm' : 'bg-[#2b2b2b] border border-transparent'
      }`}
      role="switch"
      aria-checked={isLight}
      aria-label="Toggle dark and light mode"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`pointer-events-none relative inline-flex h-6 w-6 transform items-center justify-center rounded-full shadow-sm transition-transform duration-300 ease-in-out ${
          isLight ? 'translate-x-[34px] bg-black' : 'translate-x-1 bg-white'
        }`}
      >
        <span
          className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-300 ease-in-out ${
            isLight ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          <Sun size={14} className="text-[#2b2b2b]" strokeWidth={2.5} />
        </span>
        <span
          className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-300 ease-in-out ${
            isLight ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <Moon size={14} className="text-white" strokeWidth={2.5} />
        </span>
      </span>
    </button>
  );
}
