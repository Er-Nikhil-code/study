import Link from "next/link";
import Panel from "../ui/Panel";

export type TestCardData = {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  questions: number;
  status: "upcoming" | "live" | "completed";
};

export default function TestCard({ test }: { test: TestCardData }) {
  const statusStyles = {
    upcoming: "border-zinc-700 bg-zinc-900/60 text-zinc-300",
    live: "border-red-500/30 bg-red-500/10 text-red-200",
    completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  }[test.status];

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{test.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{test.subject}</p>
        </div>
        <span
          className={[
            "rounded-full border px-3 py-1 text-xs capitalize",
            statusStyles,
          ].join(" ")}
        >
          {test.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-zinc-300">
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <div className="text-xs text-zinc-500">Duration</div>
          <div className="mt-1 font-medium">{test.durationMinutes} min</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <div className="text-xs text-zinc-500">Questions</div>
          <div className="mt-1 font-medium">{test.questions}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <div className="text-xs text-zinc-500">Test ID</div>
          <div className="mt-1 truncate font-medium">{test.id}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/tests/${test.id}`}
          className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
        >
          Open
        </Link>
      </div>
    </Panel>
  );
}
