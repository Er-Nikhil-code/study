"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import studentService, { type LeaderboardRow } from "@/services/student.service";

const PERIODS = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "global", label: "All Time" },
] as const;

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "global">("weekly");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    studentService
      .getLeaderboard(period)
      .then((res) => setRows(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <DashboardShell activeHref="/leaderboard">
        <SectionTitle title="Leaderboard" subtitle="See how you stack up against other students." />

        {/* Period tabs */}
        <div className="mt-6 flex gap-2">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                period === p.value
                  ? "border border-red-500/30 bg-red-500/10 text-red-200"
                  : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        <Panel className="mt-4 overflow-hidden p-0 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <div>Rank</div><div>Name</div><div>Score</div><div>Tests</div><div>Accuracy</div><div>Streak</div>
          </div>

          {loading ? (
            <div className="divide-y divide-white/10">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 px-5 py-4">
                  <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-12 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-10 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">No data yet for this period.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {rows.map((row) => (
                <div key={row.user_id}
                  className={`grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 px-5 py-4 text-sm items-center ${
                    row.rank <= 3 ? "bg-white/[0.02]" : ""
                  }`}>
                  <div className={`font-bold ${
                    row.rank === 1 ? "text-red-300" : row.rank === 2 ? "text-zinc-300" : row.rank === 3 ? "text-red-600" : "text-zinc-500"
                  }`}>
                    {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : `#${row.rank}`}
                  </div>
                  <div className="truncate text-white">{row.name}</div>
                  <div className="text-white font-medium">{row.total_score}</div>
                  <div className="text-zinc-400">{row.tests}</div>
                  <div className="text-zinc-400">{row.accuracy ? `${Math.round(row.accuracy)}%` : "—"}</div>
                  <div className="text-zinc-400">{row.streak}d</div>
                </div>
              ))}
            </div>
          )}
        </div>
        </Panel>
    </DashboardShell>
  );
}
