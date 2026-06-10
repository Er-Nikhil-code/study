"use client";

import { useEffect, useState } from "react";
import Panel from "@/components/ui/Panel";
import studentService, { type LeaderboardRow } from "@/services/student.service";

const PERIODS = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "global", label: "All Time" },
] as const;

export default function CourseLeaderboard({ courseId }: { courseId: string }) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "global">("global");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    studentService
      .getLeaderboard(period, courseId)
      .then((res) => setRows(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, courseId]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Course Leaderboard</h2>
        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          {PERIODS.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                period === p.value
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Panel className="p-0 overflow-hidden border border-white/10">
        <div className="overflow-x-auto min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 border-b border-white/10 bg-black/40 px-5 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <div>Rank</div><div>Name</div><div>Score</div><div>Tests</div><div>Accuracy</div><div>Streak</div>
          </div>

          {loading ? (
            <div className="divide-y divide-white/5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 px-5 py-4 bg-zinc-900/50">
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
            <div className="px-5 py-8 text-center text-sm text-zinc-500 bg-zinc-900/30">
              No students are currently active in this course.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {rows.map((row) => (
                <div key={row.user_id}
                  className={`grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 px-5 py-4 text-sm items-center transition-colors hover:bg-white/[0.02] ${
                    row.rank <= 3 ? "bg-white/[0.02]" : "bg-zinc-900/30"
                  }`}>
                  <div className={`font-bold ${
                    row.rank === 1 ? "text-red-300" : row.rank === 2 ? "text-zinc-300" : row.rank === 3 ? "text-red-600" : "text-zinc-500"
                  }`}>
                    {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : `#${row.rank}`}
                  </div>
                  <div className="truncate text-white font-medium">{row.name}</div>
                  <div className="text-white font-semibold">{row.total_score}</div>
                  <div className="text-zinc-400">{row.tests}</div>
                  <div className="text-zinc-400">{row.accuracy ? `${Math.round(row.accuracy)}%` : "—"}</div>
                  <div className="text-zinc-400">{row.streak}d</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
