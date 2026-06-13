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


          {/* Lower Section: Focus Areas & Course Progress */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Suggested Focus Areas */}
            <div className="flex flex-col">
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Suggested Focus Areas</h3>
              {(!studentData.weak_topics || studentData.weak_topics.length === 0) ? (
                <Panel className="flex-1 flex flex-col items-center justify-center min-h-[150px]">
                  <p className="text-sm text-zinc-500">No weak areas detected yet.</p>
                </Panel>
              ) : (
                <Panel accent className="flex-1">
                  <p className="text-xs text-zinc-400 mb-4">Based on your recent performance, we highly suggest reviewing these topics:</p>
                  <div className="space-y-2">
                    {studentData.weak_topics.slice(0, 3).map((w: any) => {
                      const topWeak = studentData.weak_topics.slice(0, 3);
                      const maxWrong = Math.max(...topWeak.map((x: any) => x.wrong_count));
                      const intensity = maxWrong > 0 ? (w.wrong_count / maxWrong) * 100 : 0;
                      const bgOpacity = (intensity / 100) * 0.3; // Max 30% opacity
                      
                      return (
                        <div key={w.topic_id} className="relative overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between group">
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

            {/* Enrolled Courses Progress */}
            <div className="flex flex-col">
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Course Progress</h3>
              {(!studentData.enrolled_courses || studentData.enrolled_courses.length === 0) ? (
                <Panel className="flex-1 flex flex-col items-center justify-center min-h-[150px]">
                  <p className="text-sm text-zinc-500">You are not enrolled in any courses yet.</p>
                </Panel>
              ) : (
                <div className="flex flex-col gap-3 flex-1">
                  {studentData.enrolled_courses.map((c: any) => (
                    <Link key={c.id} href={`/courses/${c.id}`}>
                      <Panel className="group relative flex items-center justify-between p-4 hover:bg-white/[0.04] transition cursor-pointer">
                        <div>
                          <h4 className="font-medium text-white">{c.name}</h4>
                          <p className="text-xs text-zinc-500 mt-1">{c.completed_topics} / {c.total_topics} topics completed</p>
                        </div>
                        
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 group-hover:scale-105 transition-transform" title={`${c.progress_percentage}% completed`}>
                          <svg className="absolute h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                            <path
                              className="text-white/5"
                              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            />
                            <path
                              className="text-green-500 transition-all duration-1000 ease-out"
                              strokeDasharray={`${c.progress_percentage}, 100`}
                              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            />
                          </svg>
                          <span className="text-[10px] font-bold text-white z-10">{c.progress_percentage}%</span>
                        </div>
                      </Panel>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="mt-8">
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

            <Panel className="overflow-hidden p-0 overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500 text-center">
                  <div>Rank</div><div>Name</div><div className="text-left">Score</div><div>Tests</div><div>Accuracy</div><div>Streak</div>
                </div>

                {loadingLeaderboard ? (
                  <div className="divide-y divide-white/10">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 px-5 py-4">
                        <div className="h-4 w-8 mx-auto rounded bg-white/10 animate-pulse" />
                        <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
                        <div className="h-4 w-12 mx-auto rounded bg-white/10 animate-pulse" />
                        <div className="h-4 w-8 mx-auto rounded bg-white/10 animate-pulse" />
                        <div className="h-4 w-10 mx-auto rounded bg-white/10 animate-pulse" />
                        <div className="h-4 w-8 mx-auto rounded bg-white/10 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (!leaderboardRes || leaderboardRes.data.length === 0) ? (
                  <div className="px-5 py-8 text-center text-sm text-zinc-500">No data yet for this period.</div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {leaderboardRes.data.map((row: any) => (
                      <div key={row.user_id}
                        className={`grid grid-cols-[60px_minmax(0,1fr)_90px_70px_80px_70px] gap-3 px-5 py-3 text-sm items-center ${
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
                        <div className="text-zinc-400 text-center">{row.accuracy ? `${Math.round(row.accuracy)}%` : "—"}</div>
                        <div className="text-zinc-400 text-center">{row.streak}d</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Quick links */}
          <div className="mt-8 grid gap-3 grid-cols-1 sm:grid-cols-2">
            <Link href="/results" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
              <div className="text-sm font-medium text-white">My Results</div>
              <p className="text-xs text-zinc-500 mt-1">Review past attempts</p>
            </Link>
            <Link href="/profile" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
              <div className="text-sm font-medium text-white">Profile</div>
              <p className="text-xs text-zinc-500 mt-1">Update your info</p>
            </Link>
          </div>
        </>
      ) : null}
    </>
  );
}
