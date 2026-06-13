"use client";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import studentService from "@/services/student.service";
import Panel from "@/components/ui/Panel";
import { useAuthStore } from "@/store/auth.store";
import ActivityGraph from "@/components/ui/ActivityGraph";
import MarksGraph from "@/components/ui/MarksGraph";
import ChessPiece3D from "@/components/ui/ChessPiece3D";

export default function StudentDashboardPage() {
  const { user } = useAuthStore();

  const { data: studentData, isLoading: loading } = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => studentService.getDashboard(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  const { data: upcomingTests } = useQuery({
    queryKey: ["tests", "upcoming"],
    queryFn: () => studentService.getTests({ limit: 5 }),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  const [period, setPeriod] = useState<"weekly" | "monthly" | "global">("weekly");
  const { data: leaderboardRes, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => studentService.getLeaderboard(period),
    staleTime: 1000 * 60 * 5,
  });

  if (!user) return null;
  const firstName = (user as any).first_name || user.firstName;
  const lastName = (user as any).last_name || user.lastName;
  const name = firstName 
    ? `${firstName}${lastName ? ` ${lastName}` : ""}` 
    : user.email.split("@")[0];

  return (
    <>
      <div className="flex items-center justify-between gap-6 mb-8 bg-gradient-to-r from-red-500/10 to-transparent p-6 rounded-2xl relative min-h-[160px]">
        <div className="z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Warrior Dashboard</h1>
          <p className="text-zinc-400">Welcome back, {name}. Here's your learning overview.</p>
        </div>
        <div className="h-40 w-40 hidden sm:block shrink-0 z-10 absolute right-10 top-1/2 -translate-y-[40%]">
          <ChessPiece3D role="STUDENT" />
        </div>
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-[radial-gradient(ellipse_at_center,rgba(255,50,50,0.15)_0%,transparent_70%)] pointer-events-none" />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 hidden rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : studentData ? (
        <>
          {/* Streak + Rank row */}
          {/* Quick Stats */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Panel accent>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current Streak</div>
              <div className="mt-2 text-3xl font-semibold text-red-300">{studentData.current_streak}🔥</div>
              <div className="mt-1 text-xs text-zinc-500">Longest: {studentData.longest_streak} days</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Global Rank</div>
              <div className="mt-2 text-3xl font-semibold text-white">#{studentData.global_rank || "—"}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tests Taken</div>
              <div className="mt-2 text-3xl font-semibold text-white">{studentData.total_tests}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Today</div>
              <div className="mt-2 text-3xl font-semibold text-white">
                {studentData.tests_today} test{studentData.tests_today !== 1 ? "s" : ""}
                {studentData.has_activity_today && <span className="ml-2 text-emerald-400 text-sm">✓ Active</span>}
              </div>
            </Panel>
          </div>

          {/* Graph Section: Activity Graph & Marks Line Graph */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6" id="analytics">
            <div className="flex flex-col">
              {studentData.activity_graph ? (
                <Panel className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-zinc-500 font-semibold shrink-0">Activity History</h3>
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <ActivityGraph data={studentData.activity_graph} userName={name} />
                  </div>
                </Panel>
              ) : (
                <Panel className="flex-1 flex items-center justify-center min-h-[300px]">
                  <p className="text-zinc-500 text-sm">Activity data not available</p>
                </Panel>
              )}
            </div>
            
            <div className="flex flex-col">
              <MarksGraph 
                history={studentData.marks_history || []} 
                weakTopics={studentData.weak_topics || []}
                enrolledCourses={studentData.enrolled_courses || []} 
              />
            </div>
          </div>


          {/* Lower Section: Leaderboard & Focus Areas */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* Leaderboard Section (Left) */}
            <div className="flex flex-col h-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
                <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Leaderboard</h3>
                <div className="flex gap-2">
                  {[
                    { value: "weekly", label: "This Week" },
                    { value: "monthly", label: "This Month" },
                    { value: "global", label: "All Time" },
                  ].map((p) => (
                    <button key={p.value} onClick={() => setPeriod(p.value as any)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        period === p.value
                          ? "border border-red-500/30 bg-red-500/10 text-red-200"
                          : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white"
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <Panel className="overflow-hidden p-0 flex-1 flex flex-col">
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="grid grid-cols-[40px_minmax(120px,2.5fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(80px,1fr)_minmax(60px,1fr)] gap-2 border-b border-white/10 px-4 py-4 text-[9px] uppercase tracking-[0.2em] text-zinc-500 text-center">
                      <div>Rank</div><div className="text-left">Name</div><div className="text-left">Score</div><div>Tests</div><div>Accuracy</div><div>Streak</div>
                    </div>

                    {loadingLeaderboard ? (
                      <div className="divide-y divide-white/10">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="grid grid-cols-[40px_minmax(120px,2.5fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(80px,1fr)_minmax(60px,1fr)] gap-2 px-4 py-4">
                            <div className="h-4 w-6 mx-auto rounded bg-white/10 animate-pulse" />
                            <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                            <div className="h-4 w-8 rounded bg-white/10 animate-pulse text-left" />
                            <div className="h-4 w-6 mx-auto rounded bg-white/10 animate-pulse" />
                            <div className="h-4 w-8 mx-auto rounded bg-white/10 animate-pulse" />
                            <div className="h-4 w-6 mx-auto rounded bg-white/10 animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : (!leaderboardRes || leaderboardRes.data.length === 0) ? (
                      <div className="px-5 py-8 text-center text-sm text-zinc-500">No data yet for this period.</div>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {leaderboardRes.data.map((row: any) => (
                          <div key={row.user_id}
                            className={`grid grid-cols-[40px_minmax(120px,2.5fr)_minmax(60px,1fr)_minmax(60px,1fr)_minmax(80px,1fr)_minmax(60px,1fr)] gap-2 px-4 py-3 text-xs items-center ${
                              row.rank <= 3 ? "bg-white/[0.02]" : ""
                            }`}>
                            <div className={`font-bold text-center ${
                              row.rank === 1 ? "text-red-300" : row.rank === 2 ? "text-zinc-300" : row.rank === 3 ? "text-red-600" : "text-zinc-500"
                            }`}>
                              {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : `#${row.rank}`}
                            </div>
                            <div className="truncate text-white text-left">{row.name}</div>
                            <div className="text-white font-medium text-left">{row.total_score}</div>
                            <div className="text-zinc-400 text-center">{row.tests}</div>
                            <div className="text-zinc-400 text-center">{row.accuracy !== undefined && row.accuracy !== null ? `${Math.round(row.accuracy)}%` : "—"}</div>
                            <div className="text-zinc-400 text-center">{row.streak}d</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </div>

            {/* Suggested Focus Areas (Right) */}
            <div className="flex flex-col h-full">
              <div className="h-8 mb-3 flex items-center justify-between sm:mt-1">
                <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Suggested Focus Areas</h3>
              </div>
              
              {(!studentData.weak_topics || studentData.weak_topics.length === 0) ? (
                <Panel className="flex-1 flex flex-col items-center justify-center min-h-[150px]">
                  <p className="text-sm text-zinc-500">No weak areas detected yet.</p>
                </Panel>
              ) : (
                <Panel accent className="flex-1 flex flex-col p-5">
                  <p className="text-xs text-zinc-400 mb-5">Based on your recent performance, we highly suggest reviewing these topics:</p>
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    {studentData.weak_topics.slice(0, 4).map((w: any) => {
                      const topWeak = studentData.weak_topics.slice(0, 4);
                      const maxWrong = Math.max(...topWeak.map((x: any) => x.wrong_count));
                      const intensity = maxWrong > 0 ? (w.wrong_count / maxWrong) * 100 : 0;
                      const bgOpacity = (intensity / 100) * 0.3; // Max 30% opacity
                      
                      return (
                        <div key={w.topic_id} className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between group">
                          <div 
                            className="absolute inset-0 bg-red-500 pointer-events-none transition-opacity duration-500" 
                            style={{ opacity: bgOpacity }} 
                          />
                          <div className="relative z-10 flex flex-col">
                            <span className="text-sm font-medium text-white group-hover:text-red-400 transition">{w.topic_name}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{w.subject}</span>
                          </div>
                          <div className="relative z-10 flex items-center gap-2">
                            <span className="text-xs font-bold text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">{w.wrong_count} Mistakes</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              )}
            </div>
            
          </div>
        </>
      ) : null}
    </>
  );
}
