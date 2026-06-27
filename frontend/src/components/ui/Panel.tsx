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
        // Base — slightly more visible bg and border for readability
        "relative rounded-2xl border p-5",
        "shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "backdrop-blur-xl transition-colors duration-150",
        "bg-white/[0.04] border-white/[0.10] hover:bg-white/[0.065] hover:border-white/[0.16]",
        accent
          ? "ring-1 ring-red-500/25 border-red-500/25 shadow-[0_0_24px_rgba(225,29,72,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] bg-gradient-to-b from-red-500/[0.07] to-transparent"
          : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
