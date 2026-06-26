"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import studentService from "@/services/student.service";
import { useAuthStore } from "@/store/auth.store";
import { api } from "@/lib/api";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";

export default function TestDetailsPage() {
  const { user } = useAuthStore();
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const [leaderboardData, setLeaderboardData] = useState<any>(null);

  useEffect(() => {
    if (!user) return; // Wait for auth
    const isTeacher = user.role === "TEACHER" || user.role === "ADMIN";
    const fetchTestDetails = isTeacher 
      ? api.get(`/tests/${testId}/preview`).then(res => res.data)
      : studentService.getTestDetails(testId);

    Promise.all([
      fetchTestDetails,
      studentService.getTestLeaderboard(testId).catch(() => null)
    ])
      .then(([testData, lbData]) => {
        setTest(testData);
        if (lbData) setLeaderboardData(lbData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [testId, user]);

  const handleStart = async () => {
    setStarting(true);
    const features = `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${window.screen.availWidth},height=${window.screen.availHeight}`;
    const win = window.open("about:blank", "testWindow", features);
    if (!win) {
      alert("Popup blocked! Please allow popups for this site to take the test in a dedicated window.");
      setStarting(false);
      return;
    }
    
    try {
      const result = await studentService.startAttempt(testId);
      const url = `/tests/${testId}/attempt?attemptId=${result.attempt.id}`;
      win.location.href = window.location.origin + url;
    } catch (err: any) {
      win.close();
      alert(err?.response?.data?.message || "Failed to start test");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="h-8 w-48 hidden rounded bg-white/10" />
        <div className="mt-4 h-64 hidden rounded-2xl bg-white/[0.03]" />
      </>
    );
  }

  if (!test) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-zinc-500">Test not found.</p>
          <Link href="/tests" className="mt-4 inline-block text-red-400 hover:text-red-300">
            ← Back to tests
          </Link>
        </div>
      </>
    );
  }

  const questionCount = test._count?.test_questions ?? 0;
  const attemptCount = test._count?.attempts ?? 0;

  return (
    <>
        <SectionTitle
          title={test.title}
          subtitle={test.description || "Ready when you are."}
          action={
            user && (user.role === "ADMIN" || test.created_by === user.id) ? (
              <Link
                href={`/teacher/tests/${testId}/edit`}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
              >
                Edit Test
              </Link>
            ) : null
          }
        />

        <Panel accent className="mt-6 mb-8">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Duration</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {test.duration_minutes} min
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Questions</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {questionCount}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Marks / Question</div>
              <div className="mt-1 text-xl font-semibold flex items-baseline gap-1.5">
                <span className="text-emerald-400">+{test.positive_marks || 0}</span>
                <span className="text-zinc-600 text-sm">/</span>
                <span className="text-red-400">-{test.negative_marks || 0}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Total Marks</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {test.total_marks}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Passing Marks</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {test.passing_marks ?? "N/A"}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Attempts</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {attemptCount}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {user?.role !== "TEACHER" && user?.role !== "ADMIN" && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
              >
                {starting ? "Starting…" : "Start Attempt"}
              </button>
            )}
            {(user?.role === "ADMIN" || test.created_by === user?.id) && (
              <Link
                href={`/teacher/tests/${test.id}/edit`}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
              >
                Edit Test
              </Link>
            )}
            <button
              onClick={() => router.back()}
              className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]"
            >
              Back
            </button>
          </div>
        </Panel>

        {leaderboardData && (
          <div className="w-full lg:w-1/2">
            <Panel className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <h3 className="text-lg font-bold text-white mb-2">Leaderboard Analysis</h3>
            <p className="text-sm text-zinc-400 mb-6">
              Ranks are calculated based on the <strong>First Attempt</strong> only. Total participants: {leaderboardData.total_participants}
            </p>
            
            {leaderboardData.currentUserRank !== null && (
              <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                    #{leaderboardData.currentUserRank}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-emerald-100">Your First Attempt Rank</div>
                    <div className="text-xs text-emerald-400/80">Keep pushing! Consistent practice improves speed and accuracy.</div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-center text-sm text-zinc-300">
                <thead className="bg-black/40 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl text-center w-1/4">Rank</th>
                    <th className="px-4 py-3 text-center w-1/4">Warrior</th>
                    <th className="px-4 py-3 text-center w-1/4">Score</th>
                    <th className="px-4 py-3 rounded-tr-xl text-center w-1/4">Time Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboardData.leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                        No attempts yet. Be the first!
                      </td>
                    </tr>
                  ) : (
                    leaderboardData.leaderboard.map((row: any) => (
                      <tr key={row.attempt_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium">
                          {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `#${row.rank}`}
                        </td>
                        <td className="px-4 py-3 flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                            {row.user?.profile_picture ? (
                              <Image src={row.user.profile_picture} alt="" width={24} height={24} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon size={14} className="text-zinc-500" />
                            )}
                          </div>
                          <span>{row.user?.first_name} {row.user?.last_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-white font-medium">{row.score}</span>
                          <span className="text-zinc-500 text-xs ml-1">/ {row.max_score}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {Math.floor((row.time_taken_sec || 0) / 60)}m {(row.time_taken_sec || 0) % 60}s
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </Panel>
          </div>
        )}

        {test.test_questions && test.test_questions.length > 0 && test.test_questions[0]?.question?.question_type && (
          <Panel className="mt-8 border-white/10 bg-white/[0.02]">
            <h3 className="text-lg font-bold text-white mb-6">Test Questions (Preview)</h3>
            <div className="space-y-6">
              {test.test_questions.map((tq: any, idx: number) => (
                <div key={tq.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-xs font-bold text-red-400">
                        Q{idx + 1}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                        {tq.question.question_type.replace(/_/g, " ")} · {tq.question.difficulty} · {test.positive_marks || tq.marks_override || tq.question.marks} marks
                        {(test.negative_marks ?? tq.question.negative_marks) > 0 && <span className="text-red-400 ml-1">(−{test.negative_marks ?? tq.question.negative_marks})</span>}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ContentBlockRenderer blocks={tq.question.content_json || []} />
                  </div>

                  {/* Options */}
                  {tq.question.options_json?.options && tq.question.options_json.options.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {tq.question.options_json.options.map((opt: any) => (
                        <div key={opt.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300 flex items-start">
                          <span className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600 text-xs mr-3 mt-0.5">
                            {opt.id}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Correct Answer */}
                  {tq.question.answer_key && (
                    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="text-xs uppercase tracking-wide text-emerald-400 mb-2">Answer Key</div>
                      <div className="text-sm text-emerald-200">
                        {JSON.stringify(tq.question.answer_key)}
                      </div>
                    </div>
                  )}

                  {/* Solution */}
                  {tq.question.solution_json && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Solution Explanation</div>
                      <ContentBlockRenderer blocks={Array.isArray(tq.question.solution_json) ? tq.question.solution_json : []} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        )}
    </>
  );
}
