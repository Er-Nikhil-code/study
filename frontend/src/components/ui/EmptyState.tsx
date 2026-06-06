import Link from "next/link";
import Panel from "./Panel";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Panel className="flex flex-col items-start gap-4 text-left">
      <div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
          {description}
        </p>
      </div>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
        >
          {actionLabel}
        </Link>
      ) : null}
    </Panel>
  );
}
