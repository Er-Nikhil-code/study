import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  accent?: boolean;
};

export default function Panel({
  children,
  className = "",
  accent = false,
}: PanelProps) {
  return (
    <div
      className={[
        "rounded-3xl border p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        "bg-white/[0.03] border-white/10",
        accent ? "ring-1 ring-red-500/20 border-red-500/20" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
