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
        "relative rounded-3xl border p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300",
        "bg-gradient-to-b from-white/[0.04] to-white/[0.01] border-white/[0.08] hover:border-white/[0.12] hover:bg-white/[0.05]",
        accent 
          ? "ring-1 ring-red-500/30 border-red-500/30 shadow-[0_0_30px_rgba(225,29,72,0.15)]" 
          : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
