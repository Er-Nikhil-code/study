import React from "react";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500"] 
});

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl md:text-7xl",
  };

  const lineSizeClasses = {
    sm: "h-0.5 w-6",
    md: "h-1 w-8",
    lg: "h-1 w-12",
    xl: "h-1.5 w-24",
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div
        className={`${sizeClasses[size]} ${quicksand.className} font-medium tracking-[0.1em] uppercase flex items-center pr-2 pb-1`}
      >
        <span className="text-red-600 drop-shadow-[0_1px_2px_rgba(220,38,38,0.5)]">
          C
        </span>
        <span className="text-white drop-shadow-sm">
          ODIFY
        </span>
      </div>
      <div
        className={`${lineSizeClasses[size]} mt-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]`}
      />
    </div>
  );
}
