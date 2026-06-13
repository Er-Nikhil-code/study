"use client";

import { useEffect, useState } from "react";
import Panel from "@/components/ui/Panel";
import studentService, { type LeaderboardRow } from "@/services/student.service";

const PERIODS = [
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
  { value: "global", label: "All Time" },
] as const;

export default function CourseLeaderboard({ courseId, headerActions }: { courseId: string, headerActions?: React.ReactNode }) {
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
        <div className="flex items-center gap-4">
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
          {headerActions}
        </div>
      </div>

      <Panel className="p-0 overflow-hidden border border-white/10">
        <div className="overflow-x-auto min-w-[450px]">
          {/* Header */}
          <div className="grid grid-cols-6 gap-3 border-b border-white/10 bg-black/40 px-4 py-3 text-[10px] uppercase tracking-[0.1em] text-zinc-500 text-center">
            <div>Rank</div>
            <div>Name</div>
            <div>Score</div>
            <div>Tests</div>
            <div>Accuracy</div>
            <div>Streak</div>
          </div>

          {loading ? (
            <div className="divide-y divide-white/5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-3 px-4 py-3 bg-zinc-900/50">
                  <div className="h-4 w-8 hidden rounded bg-white/10 mx-auto" />
                  <div className="h-4 w-32 hidden rounded bg-white/10" />
                  <div className="h-4 w-12 hidden rounded bg-white/10 mx-auto" />
                  <div className="h-4 w-8 hidden rounded bg-white/10 mx-auto" />
                  <div className="h-4 w-10 hidden rounded bg-white/10 mx-auto" />
                  <div className="h-4 w-8 hidden rounded bg-white/10 mx-auto" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-zinc-500 bg-zinc-900/30">
              No warriors are currently active in this course.
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto custom-scrollbar">
              {rows.map((row) => (
                <div key={row.user_id}
                  className={`grid grid-cols-6 gap-3 px-4 py-3 text-sm items-center transition-colors hover:bg-white/[0.02] text-center ${
                    row.rank <= 3 ? "bg-white/[0.02]" : "bg-zinc-900/30"
                  }`}>
                  <div className={`font-bold ${
                    row.rank === 1 ? "text-amber-400" : row.rank === 2 ? "text-zinc-300" : row.rank === 3 ? "text-amber-600" : "text-zinc-500"
                  }`}>
                    {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : `#${row.rank}`}
                  </div>
                  <div className="truncate text-white font-medium">{row.name}</div>
                  <div className="text-white font-semibold">{row.total_score}</div>
                  <div className="text-zinc-400">{row.tests}</div>
                  <div className="text-zinc-400">{row.accuracy !== undefined && row.accuracy !== null ? `${Math.round(row.accuracy)}%` : "—"}</div>
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
