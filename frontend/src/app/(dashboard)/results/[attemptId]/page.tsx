"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import StatCard from "@/components/ui/StatCard";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import studentService from "@/services/student.service";

const CHALLENGE_REASONS = [
  { value: "WRONG_ANSWER_KEY", label: "Wrong answer key" },
  { value: "AMBIGUOUS_QUESTION", label: "Ambiguous question" },
  { value: "WRONG_EXPLANATION", label: "Wrong explanation" },
  { value: "TYPO", label: "Typo" },
  { value: "UNCLEAR_WORDING", label: "Unclear wording" },
  { value: "OTHER", label: "Other" },
];

export default function ResultDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const attemptId = params.attemptId as string;
  const testId = searchParams.get("testId") || "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  // Challenge modal
  const [challengeQ, setChallengeQ] = useState<any>(null);
  const [challengeReason, setChallengeReason] = useState("WRONG_ANSWER_KEY");
  const [challengeDesc, setChallengeDesc] = useState("");
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  useEffect(() => {
    studentService
      .getAttemptResult(testId, attemptId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [testId, attemptId]);

  const handleChallenge = async () => {
    if (!challengeQ) return;
    setChallengeLoading(true);
    try {
      await studentService.submitChallenge({
        response_id: challengeQ.responseId || "",
        question_id: challengeQ.id,
        reason: challengeReason,
        description: challengeDesc,
      });
      setChallengeSuccess(true);
      setTimeout(() => { setChallengeQ(null); setChallengeSuccess(false); setChallengeDesc(""); }, 2000);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit challenge");
    } finally {
      setChallengeLoading(false);
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

  if (!data) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-zinc-500">Result not found.</p>
          <Link href="/results" className="mt-4 inline-block text-red-400 hover:text-red-300">← Back to results</Link>
        </div>
      </>
    );
  }

  const responses = data.responses || [];
  const correct = responses.filter((r: any) => r.is_correct === true).length;
  const wrong = responses.filter((r: any) => r.is_correct === false).length;
  const skipped = (data.test?._count?.test_questions || 0) - responses.length;
  const timeTaken = data.time_taken_sec ? `${Math.floor(data.time_taken_sec / 60)}m ${data.time_taken_sec % 60}s` : "—";

  return (
    <>
        <SectionTitle title={data.test?.title || "Test Result"} subtitle={`Attempt #${data.attempt_no} · ${data.practice_mode ? "Practice" : "Scored"}`} />

        {/* Score summary */}
        <Panel accent className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm text-zinc-400">Overall Score</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight text-white">
                {data.score ?? 0}<span className="text-zinc-500 text-2xl">/{data.test?.total_marks}</span>
              </div>
            </div>
            <div className="text-sm text-zinc-400">Time: <span className="font-semibold text-white">{timeTaken}</span></div>
          </div>
        </Panel>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <StatCard label="Correct" value={correct} tone="green" />
          <StatCard label="Wrong" value={wrong} tone="red" />
          <StatCard label="Skipped" value={skipped} tone="amber" />
          <StatCard label="Accuracy" value={`${responses.length > 0 ? Math.round((correct / responses.length) * 100) : 0}%`} />
        </div>

        {/* Question-by-question breakdown */}
        <h3 className="mt-8 text-sm uppercase tracking-[0.2em] text-zinc-500 mb-4">Question-by-Question Review</h3>

        <div className="space-y-3">
          {responses.map((r: any, idx: number) => {
            const q = r.question;
            const isExpanded = expandedQ === r.id;

            return (
              <Panel key={r.id} className="p-0 overflow-hidden">
                <button
                  onClick={() => setExpandedQ(isExpanded ? null : r.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      r.is_correct === true ? "bg-emerald-500/20 text-emerald-300"
                        : r.is_correct === false ? "bg-red-500/20 text-red-300"
                        : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {r.is_correct === true ? "✓" : r.is_correct === false ? "✗" : "—"}
                    </span>
                    <div className="truncate">
                      <span className="text-sm text-white">{`Q${idx + 1}`}</span>
                      <span className="ml-2 text-xs text-zinc-500">{q?.difficulty} · {q?.marks} marks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${
                      (r.marks_obtained ?? 0) > 0 ? "text-emerald-300" : (r.marks_obtained ?? 0) < 0 ? "text-red-400" : "text-zinc-500"
                    }`}>
                      {r.marks_obtained !== null ? (r.marks_obtained > 0 ? `+${r.marks_obtained}` : r.marks_obtained) : "0"}
                    </span>
                    <span className="text-zinc-500 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </button>

                {isExpanded && q && (
                  <div className="border-t border-white/5 bg-white/[0.02] px-5 py-4 space-y-4">
                    {/* Question content */}
                    <ContentBlockRenderer blocks={q.content_json || []} />

                    {/* Your answer vs correct answer */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Your Answer</div>
                        <div className="text-sm text-white">{JSON.stringify(r.answer_json)}</div>
                      </div>
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <div className="text-xs uppercase tracking-wide text-emerald-400 mb-1">Correct Answer</div>
                        <div className="text-sm text-emerald-200">{JSON.stringify(q.answer_key)}</div>
                      </div>
                    </div>

                    {/* Solution */}
                    {q.solution_json && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Solution</div>
                        <ContentBlockRenderer blocks={Array.isArray(q.solution_json) ? q.solution_json : []} />
                      </div>
                    )}

                    {/* Topic */}
                    {q.topic && (
                      <div className="text-xs text-zinc-500">
                        {q.topic.chapter?.section?.course?.name ?? "Course"} → {q.topic.chapter?.name} → {q.topic.name}
                      </div>
                    )}

                    {/* Challenge button */}
                    <button
                      onClick={() => setChallengeQ({ ...q, responseId: r.id })}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
                    >
                      ⚡ Challenge This Question
                    </button>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>

        <div className="mt-6">
          <Link href="/results" className="text-sm text-zinc-400 hover:text-white transition">← Back to all results</Link>
        </div>

      {/* Challenge Modal */}
      {challengeQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            {challengeSuccess ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white font-medium">Challenge Submitted!</p>
                <p className="text-sm text-zinc-400 mt-1">The question creator has been notified.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-white mb-1">Challenge Question</h3>
                <p className="text-sm text-zinc-400 mb-4">Are you sure you want to challenge this question?</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">Reason</label>
                    <select value={challengeReason} onChange={(e) => setChallengeReason(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none focus:border-red-500/30 appearance-none cursor-pointer">
                      {CHALLENGE_REASONS.map((r) => (
                        <option key={r.value} value={r.value} className="bg-zinc-900">{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">Description</label>
                    <textarea value={challengeDesc} onChange={(e) => setChallengeDesc(e.target.value)}
                      placeholder="Reason for challenge..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-red-500/30 min-h-[100px]" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { setChallengeQ(null); setChallengeDesc(""); }}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white">Cancel</button>
                  <button onClick={handleChallenge} disabled={challengeLoading || !challengeDesc.trim()}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                    {challengeLoading ? "Submitting…" : "Submit Challenge"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
