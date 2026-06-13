import type { ReactNode } from "react";

type SectionTitleProps = {
  title: string;
  subtitle?: string | ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function SectionTitle({
  title,
  subtitle,
  action,
  className = "",
}: SectionTitleProps) {
  return (
    <div
      className={["flex items-start justify-between gap-4", className].join(
        " ",
      )}
    >
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
