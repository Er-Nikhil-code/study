import React from "react";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["800"] 
});

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-7xl md:text-8xl",
  };

  const lineSizeClasses = {
    sm: "h-0.5 w-6",
    md: "h-1 w-12",
    lg: "h-1.5 w-16",
    xl: "h-2 w-32",
  };

  return (
    <div className={`flex flex-col group cursor-pointer ${className}`} style={{ perspective: "1000px" }}>
      <div
        className={`${sizeClasses[size]} ${montserrat.className} font-extrabold uppercase flex items-center pr-2 pb-1 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:rotate-x-12`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <span className="text-red-600 dark:text-red-500 drop-shadow-sm transition-all duration-300 ease-out
          group-hover:drop-shadow-[0_4px_4px_rgba(220,38,38,0.4)]
          group-hover:[text-shadow:1px_1px_0_#991b1b,2px_2px_0_#991b1b,3px_3px_0_#7f1d1d]">
          C
        </span>
        <span className="text-zinc-900 dark:text-white drop-shadow-sm transition-all duration-300 ease-out
          group-hover:drop-shadow-[0_4px_4px_rgba(0,0,0,0.2)]
          dark:group-hover:drop-shadow-[0_4px_4px_rgba(255,255,255,0.2)]
          group-hover:[text-shadow:1px_1px_0_#52525b,2px_2px_0_#52525b,3px_3px_0_#3f3f46]
          dark:group-hover:[text-shadow:1px_1px_0_#a1a1aa,2px_2px_0_#a1a1aa,3px_3px_0_#71717a]">
          ODIFY
        </span>
      </div>
      <div
        className={`${lineSizeClasses[size]} mt-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all duration-500 ease-out group-hover:w-full`}
      />
    </div>
  );
}
