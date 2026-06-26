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
        "relative rounded-3xl border p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)] backdrop-blur-3xl transition-all duration-300",
        "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]",
        accent 
          ? "ring-1 ring-red-500/30 border-red-500/30 shadow-[0_0_30px_rgba(225,29,72,0.15),inset_0_1px_2px_rgba(255,255,255,0.1)] bg-gradient-to-b from-red-500/5 to-transparent" 
          : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
