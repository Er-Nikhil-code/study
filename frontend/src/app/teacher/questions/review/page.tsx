"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import { QuestionsService } from "@/services/questions.service";
import authService from "@/services/auth.service";

const navItems = [
  { label: "Teacher home", href: "/teacher" },
  { label: "Questions", href: "/teacher/questions" },
  { label: "Tests", href: "/teacher/tests" },
  { label: "Challenges", href: "/teacher/challenges" },
];

export default function ReviewQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review modal state
  const [reviewQ, setReviewQ] = useState<any>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await QuestionsService.getPendingReview();
      setQuestions(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load pending questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async () => {
    if (!reviewQ) return;
    setActionLoading(true);
    try {
      await QuestionsService.approve(reviewQ.id);
      setReviewQ(null);
      fetchPending();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to approve question");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewQ || !rejectNote.trim()) return;
    setActionLoading(true);
    try {
      await QuestionsService.reject(reviewQ.id, rejectNote);
      setReviewQ(null);
      setRejectNote("");
      fetchPending();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reject question");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardShell activeHref="/teacher/questions" navItems={navItems}>
      <SectionTitle
        title="Review Approvals"
        subtitle={`${total} question${total !== 1 ? "s" : ""} waiting for your review.`}
        action={
          <Link href="/teacher/questions" className="text-sm text-zinc-400 hover:text-white transition">
            ← Back to Questions
          </Link>
        }
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Panel key={i} className="p-5 h-32 animate-pulse bg-white/[0.03]">
              <div />
            </Panel>
          ))
        ) : questions.length === 0 ? (
          <Panel className="py-12 text-center text-sm text-zinc-500">
            No questions pending review. Great job! 🎉
          </Panel>
        ) : (
          questions.map((q) => (
            <Panel key={q.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Intern: {q.created_by.slice(0, 8)}...
                  </div>
                  <h3 className="text-lg font-semibold text-white">{q.title}</h3>
                  <div className="flex flex-wrap gap-2 text-sm text-zinc-400">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                      {q.topic?.name || "Unknown Topic"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                      {q.question_type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <button onClick={() => setReviewQ(q)}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
                  Review
                </button>
              </div>
            </Panel>
          ))
        )}
      </div>

      {/* ═══ Review Modal ═══ */}
      {reviewQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-2">Review Question</h3>
            <p className="text-sm text-zinc-400 mb-4">{reviewQ.title}</p>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Question Content */}
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Content</div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white">
                  <ContentBlockRenderer blocks={reviewQ.content_json || []} />
                </div>
              </div>

              {/* Options (if MCQ) */}
              {reviewQ.options_json?.options && (
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Options</div>
                  <div className="space-y-2">
                    {reviewQ.options_json.options.map((opt: any) => (
                      <div key={opt.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white flex gap-3">
                        <span className="text-zinc-500">{opt.id}.</span> {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer Key */}
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">Answer Key</div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-200 text-sm font-mono">
                  {JSON.stringify(reviewQ.answer_key, null, 2)}
                </div>
              </div>

              {/* Reject Note Input */}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
                  Feedback (required for rejection)
                </label>
                <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Explain what needs to be changed..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-red-500/30 min-h-[100px]" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <button onClick={() => { setReviewQ(null); setRejectNote(""); }}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white">
                Cancel
              </button>
              <div className="flex gap-3">
                <button onClick={handleReject} disabled={actionLoading || !rejectNote.trim()}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50">
                  {actionLoading ? "Processing…" : "Reject & Require Changes"}
                </button>
                <button onClick={handleApprove} disabled={actionLoading}
                  className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">
                  {actionLoading ? "Processing…" : "Approve Question"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
