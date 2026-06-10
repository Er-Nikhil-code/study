"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { User as UserIcon } from "lucide-react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import studentService from "@/services/student.service";

export default function TestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const [leaderboardData, setLeaderboardData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      studentService.getTestDetails(testId),
      studentService.getTestLeaderboard(testId).catch(() => null)
    ])
      .then(([testData, lbData]) => {
        setTest(testData);
        if (lbData) setLeaderboardData(lbData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [testId]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const result = await studentService.startAttempt(testId);
      router.push(`/tests/${testId}/attempt?attemptId=${result.attempt.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to start test");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-64 animate-pulse rounded-2xl bg-white/[0.03]" />
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
        />

        <Panel accent className="mt-6 mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="text-xs text-zinc-500">Total Marks</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {test.total_marks}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Attempts</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {attemptCount}
              </div>
            </div>
          </div>

          {test.passing_marks && (
            <p className="mt-4 text-sm text-zinc-400">
              Passing marks: <span className="text-white font-medium">{test.passing_marks}</span>
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleStart}
              disabled={starting}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
            >
              {starting ? "Starting…" : "Start Attempt"}
            </button>
            <Link
              href="/tests"
              className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]"
            >
              Back to tests
            </Link>
          </div>
        </Panel>

        {leaderboardData && (
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
              <table className="w-full text-left text-sm text-zinc-300">
                <thead className="bg-black/40 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Rank</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3 rounded-tr-xl">Time Taken</th>
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
                        <td className="px-4 py-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                            {row.user?.profile_picture_url ? (
                              <img src={row.user.profile_picture_url} alt="" className="w-full h-full object-cover" />
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
        )}
    </>
  );
}
