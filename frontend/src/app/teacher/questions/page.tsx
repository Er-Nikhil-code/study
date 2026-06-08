"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { QuestionsService } from "@/services/questions.service";
import authService from "@/services/auth.service";

const navItems = [
  { label: "Teacher home", href: "/teacher" },
  { label: "Questions", href: "/teacher/questions" },
  { label: "Tests", href: "/teacher/tests" },
  { label: "Challenges", href: "/teacher/challenges" },
];

export default function TeacherQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Submitting state
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await QuestionsService.getAll();
      setQuestions(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = authService.getUser();
    if (user) setUserRole(user.role || "");
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSubmitReview = async (id: string) => {
    setSubmittingId(id);
    try {
      await QuestionsService.submitForReview(id);
      await fetchQuestions(); // Refresh
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit for review");
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
      case "PENDING_REVIEW": return "border-red-500/20 bg-red-500/10 text-red-300";
      case "REJECTED": return "border-red-500/20 bg-red-500/10 text-red-300";
      case "NEEDS_REVISION": return "border-rose-500/20 bg-rose-500/10 text-rose-300";
      default: return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"; // DRAFT
    }
  };

  return (
    <DashboardShell activeHref="/teacher/questions" navItems={navItems}>
      <SectionTitle
        title="Question Bank"
        subtitle={`${total} question${total !== 1 ? "s" : ""} in your workspace.`}
        action={
          <div className="flex gap-2">
            {(userRole === "TEACHER" || userRole === "ADMIN") && (
              <Link href="/teacher/questions/review"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:text-white">
                Review Approvals
              </Link>
            )}
            <Link href="/teacher/questions/create"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20">
              + Create Question
            </Link>
          </div>
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
            No questions found. Start by creating one!
          </Panel>
        ) : (
          questions.map((q) => (
            <Panel key={q.id} accent={q.approval_status === "DRAFT" || q.approval_status === "NEEDS_REVISION"} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {q.id.split("-")[0]}-{q.id.slice(-4)}
                    </div>
                    {q.approval_status === "NEEDS_REVISION" && q.rejection_note && (
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300">
                        Feedback: {q.rejection_note}
                      </span>
                    )}
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

                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(q.approval_status)}`}>
                  {q.approval_status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/teacher/questions/${q.id}/edit`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                  Edit
                </Link>
                {userRole === "INTERN" && (q.approval_status === "DRAFT" || q.approval_status === "NEEDS_REVISION") && (
                  <button onClick={() => handleSubmitReview(q.id)} disabled={submittingId === q.id}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50">
                    {submittingId === q.id ? "Submitting…" : "Submit for Review"}
                  </button>
                )}
                <button className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                  Preview
                </button>
              </div>
            </Panel>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
