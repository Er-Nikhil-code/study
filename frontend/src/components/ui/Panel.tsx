import type { ReactNode } from "react";

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  accent?: boolean;
};

export default function Panel({
  children,
  className = "",
  accent = false,
  ...props
}: PanelProps) {
  return (
    <div
      className={[
        "relative rounded-2xl border p-5 shadow-[0_8px_30px_rgb(0,0,0,0.6)] transition-all duration-300",
        "bg-[#18181b] border-white/5 hover:border-white/10",
        accent 
          ? "ring-1 ring-[#ff4e00]/30 border-[#ff4e00]/30 shadow-[0_0_30px_rgba(255,78,0,0.15)]" 
          : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
