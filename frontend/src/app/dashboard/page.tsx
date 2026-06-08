"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authService from "@/services/auth.service";
import studentService, { type StudentDashboard, type TeacherDashboard } from "@/services/student.service";
import Panel from "@/components/ui/Panel";

type Role = "STUDENT" | "PENDING_TEACHER" | "TEACHER" | "ADMIN";
type UserShape = { id?: string; email?: string; first_name?: string; firstName?: string; last_name?: string; lastName?: string; role?: Role };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserShape | null>(null);
  const [role, setRole] = useState<Role>("STUDENT");
  const [studentData, setStudentData] = useState<StudentDashboard | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = authService.getUser();
    if (!u) { router.push("/"); return; }
    setUser(u);
    setRole((u.role as Role) || "STUDENT");

    if (u.role === "ADMIN") {
      router.push("/admin");
      return;
    }

    // Fetch dashboard data
    const promises: Promise<any>[] = [studentService.getDashboard().then(setStudentData).catch(() => {})];
    if (u.role === "TEACHER") {
      promises.push(studentService.getTeacherDashboard().then(setTeacherData).catch(() => {}));
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [router]);

  const name = user?.first_name || user?.firstName || user?.email?.split("@")[0] || "User";

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.08),_transparent_40%),linear-gradient(to_bottom,_#000,_#050505)]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Welcome back, {name}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              {role === "TEACHER" ? "Teacher Dashboard" : "Student Dashboard"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/tests" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
              Take a Test
            </Link>
            <button onClick={() => { authService.logout(); router.push("/"); }}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-400 transition hover:text-white">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : (
          <>
            {/* ═══ STUDENT SECTION ═══ */}
            {studentData && (
              <>
                {/* Streak + Rank row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

                {/* Recent tests + Weak topics */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
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

                {/* Quick links */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Link href="/tests" className="group rounded-2xl border border-red-500/20 bg-red-500/5 p-4 transition hover:bg-red-500/10">
                    <div className="text-sm font-medium text-red-300">Browse Tests</div>
                    <p className="text-xs text-zinc-500 mt-1">Find and take available tests</p>
                  </Link>
                  <Link href="/results" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                    <div className="text-sm font-medium text-white">My Results</div>
                    <p className="text-xs text-zinc-500 mt-1">Review past attempts</p>
                  </Link>
                  <Link href="/leaderboard" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                    <div className="text-sm font-medium text-white">Leaderboard</div>
                    <p className="text-xs text-zinc-500 mt-1">See rankings</p>
                  </Link>
                  <Link href="/study-plan" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                    <div className="text-sm font-medium text-white">Study Plan</div>
                    <p className="text-xs text-zinc-500 mt-1">Focus on weak areas</p>
                  </Link>
                </div>
              </>
            )}

            {/* ═══ TEACHER SECTION ═══ */}
            {role === "TEACHER" && teacherData && (
              <div className="mt-8">
                <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-4">Teacher Tools</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Panel accent>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Questions Created</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{teacherData.questions_created}</div>
                  </Panel>
                  <Panel>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tests Created</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{teacherData.tests_created}</div>
                  </Panel>
                  <Panel accent={teacherData.pending_challenges > 0}>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending Challenges</div>
                    <div className="mt-2 text-3xl font-semibold text-red-300">{teacherData.pending_challenges}</div>
                  </Panel>
                  <Panel>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resolved</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{teacherData.resolved_challenges}</div>
                  </Panel>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Link href="/teacher/questions" className="group rounded-2xl border border-red-500/20 bg-red-500/5 p-4 transition hover:bg-red-500/10">
                    <div className="text-sm font-medium text-red-300">Question Bank</div>
                  </Link>
                  <Link href="/teacher/tests" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                    <div className="text-sm font-medium text-white">My Tests</div>
                  </Link>
                  <Link href="/teacher/challenges" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]">
                    <div className="text-sm font-medium text-white">Challenges</div>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
