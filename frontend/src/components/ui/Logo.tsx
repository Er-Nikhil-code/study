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
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Cute Bold C Logo */}
      <div 
        className={`${sizeClasses[size]} flex items-center justify-center font-black tracking-tighter text-white bg-gradient-to-br from-red-500 via-rose-500 to-red-700 shadow-[0_4px_20px_rgba(225,29,72,0.4)] rounded-2xl`}
        style={{
          width: size === 'sm' ? '32px' : size === 'md' ? '40px' : size === 'lg' ? '56px' : '80px',
          height: size === 'sm' ? '32px' : size === 'md' ? '40px' : size === 'lg' ? '56px' : '80px',
        }}
      >
        C
      </div>
      
      {/* Optional CODIFY Text - rendered differently depending on size or usage */}
      <div className="flex flex-col">
        <div className={`font-bold tracking-tight uppercase flex items-center ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'}`}>
          <span className="text-white drop-shadow-md">CODI</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-600 drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]">
            FY
          </span>
        </div>
      </div>
    </div>
  );
}
