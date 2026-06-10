"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import studentService from "@/services/student.service";
import Panel from "@/components/ui/Panel";
import { useAuthStore } from "@/store/auth.store";
import ActivityGraph from "@/components/ui/ActivityGraph";

export default function StudentDashboardPage() {
  const { user } = useAuthStore();

  const { data: studentData, isLoading: loading } = useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => studentService.getDashboard(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  const { data: upcomingTests } = useQuery({
    queryKey: ["tests", "upcoming"],
    queryFn: () => studentService.getTests({ take: 5 }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });


  if (!user) return null;
  const firstName = (user as any).first_name || user.firstName;
  const lastName = (user as any).last_name || user.lastName;
  const name = firstName 
    ? `${firstName}${lastName ? ` ${lastName}` : ""}` 
    : user.email.split("@")[0];

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Welcome back, {name}</h1>
          <p className="text-sm text-zinc-500 mt-1">Here's your learning overview.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : studentData ? (
        <>
          {/* Streak + Rank row */}
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
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Avg Accuracy</div>
              <div className="mt-2 text-3xl font-semibold text-white">{studentData.avg_accuracy ? `${Math.round(studentData.avg_accuracy)}%` : "—"}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Best Score</div>
              <div className="mt-2 text-3xl font-semibold text-white">{studentData.best_score ?? "—"}</div>
            </Panel>
          </div>

          {/* Activity row */}
          <div className="mt-4 grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tests Taken</div>
              <div className="mt-2 text-2xl font-semibold text-white">{studentData.total_tests}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Today</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {studentData.tests_today} test{studentData.tests_today !== 1 ? "s" : ""}
                {studentData.has_activity_today && <span className="ml-2 text-emerald-400 text-sm">✓ Active</span>}
              </div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">First Attempts</div>
              <div className="mt-2 text-2xl font-semibold text-white">{studentData.first_attempts}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Re-attempts</div>
              <div className="mt-2 text-2xl font-semibold text-white">{studentData.reattempts}</div>
            </Panel>
          </div>

          {/* Activity Graph */}
          {studentData.activity_graph && (
            <div className="mt-6">
              <ActivityGraph data={studentData.activity_graph} theme="green" />
            </div>
          )}

          {/* Recent tests + Weak topics */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2" id="analytics">
            {/* Recent tests */}
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Recent Tests</h3>
              {studentData.recent_tests.length === 0 ? (
                <Panel><p className="text-sm text-zinc-500">No tests taken yet.</p></Panel>
              ) : (
                <div className="space-y-2">
                  {studentData.recent_tests.map((t) => (
                    <Link key={t.attempt_id} href={`/results/${t.attempt_id}?testId=${t.test_id}`}>
                      <Panel className="p-3 hover:bg-white/[0.04] transition cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="truncate">
                            <span className="text-sm text-white">{t.test_title}</span>
                            <span className="ml-2 text-xs text-zinc-500">
                              {t.practice_mode ? "Practice" : `Attempt #${t.attempt_no}`}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-white">{t.score ?? "—"}<span className="text-zinc-500">/{t.max_score}</span></div>
                        </div>
                      </Panel>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Weak topics */}
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Weak Topics</h3>
              {studentData.weak_topics.length === 0 ? (
                <Panel><p className="text-sm text-zinc-500">No weak areas detected yet.</p></Panel>
              ) : (
                <div className="space-y-2">
                  {studentData.weak_topics.map((t) => (
                    <Panel key={t.topic_id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-white">{t.topic_name}</span>
                          <span className="ml-2 text-xs text-zinc-500">{t.subject} → {t.chapter}</span>
                        </div>
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                          {t.wrong_count} wrong
                        </span>
                      </div>
                    </Panel>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Tests */}
          <div className="mt-8" id="scheduled">
            <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Upcoming Tests</h3>
            {!upcomingTests?.data?.length ? (
              <Panel>
                <p className="text-sm text-zinc-500">No upcoming tests available right now.</p>
              </Panel>
            ) : (
              <div className="space-y-2">
                {upcomingTests.data.slice(0, 5).map((t) => (
                  <Link key={t.id} href={`/tests/${t.id}`}>
                    <Panel className="p-3 hover:bg-white/[0.04] transition cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-white">{t.title}</span>
                          <span className="ml-2 text-xs text-zinc-500">{t.duration_minutes} min · {t._count.test_questions} Qs</span>
                        </div>
                        <span className="text-xs text-red-300 border border-red-500/20 bg-red-500/10 px-2 py-0.5 rounded-full">
                          {t.total_marks} marks
                        </span>
                      </div>
                    </Panel>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-8 grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Link href="/courses" className="group rounded-2xl border border-red-500/20 bg-red-500/5 p-4 transition hover:bg-red-500/10">
              <div className="text-sm font-medium text-red-300">Enrolled Courses</div>
              <p className="text-xs text-red-400 mt-1 truncate">
                {studentData.enrolled_course ? studentData.enrolled_course : "Explore available courses"}
              </p>
            </Link>
            <Link href="/results" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
              <div className="text-sm font-medium text-white">My Results</div>
              <p className="text-xs text-zinc-500 mt-1">Review past attempts</p>
            </Link>
            <Link href="/leaderboard" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
              <div className="text-sm font-medium text-white">Leaderboard</div>
              <p className="text-xs text-zinc-500 mt-1">See rankings</p>
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
