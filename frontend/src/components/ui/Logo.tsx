import React from "react";

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
        className={`${sizeClasses[size]} font-bold tracking-tight uppercase flex items-center`}
      >
        <span className="text-zinc-900 dark:text-white drop-shadow-md">CODI</span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]">
          FY
        </span>
      </div>
      <div
        className={`${lineSizeClasses[size]} mt-1 bg-gradient-to-r from-red-500 to-rose-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]`}
      />
    </div>
  );
}
