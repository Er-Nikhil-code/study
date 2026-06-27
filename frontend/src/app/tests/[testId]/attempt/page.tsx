"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import studentService, {
  type AttemptQuestion,
  type SavedResponse,
} from "@/services/student.service";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import MathRenderer from "@/components/ui/MathRenderer";
import Link from "next/link";
import AppLoader from "@/components/ui/AppLoader";
import { Sun, Moon, X } from "lucide-react";
import { useThemeStore } from "@/store/theme.store";
import { toast } from "sonner";

/* ─── Helper: format seconds to MM:SS ─── */
function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ─── Question status for palette ─── */
type QStatus = "unanswered" | "answered" | "review" | "review-answered";

function getStatus(
  q: AttemptQuestion,
  answers: Record<string, any>,
  reviews: Set<string>,
): QStatus {
  const hasAnswer = !!answers[q.id];
  const isReview = reviews.has(q.id);
  if (hasAnswer && isReview) return "review-answered";
  if (isReview) return "review";
  if (hasAnswer) return "answered";
  return "unanswered";
}

const statusColors: Record<QStatus, string> = {
  unanswered: "border-zinc-300 dark:border-zinc-600 bg-white/60 dark:bg-black/40 text-zinc-700 dark:text-zinc-300 shadow-sm",
  answered: "border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.4)]",
  review: "border-purple-500 bg-purple-500 text-white shadow-[0_2px_10px_rgba(168,85,247,0.4)]",
  "review-answered":
    "border-purple-500 bg-purple-500 text-white shadow-[0_2px_10px_rgba(168,85,247,0.4)] ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-black",
};

export default function AttemptPage() {
  const { theme, toggleTheme } = useThemeStore();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const testId = params.testId as string;

  /* ─── State ─── */
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string>("");
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [reviews, setReviews] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitRef = useRef(false);

  /* ─── Load attempt ─── */
  useEffect(() => {
    async function init() {
      try {
        const result = await studentService.startAttempt(testId);
        setAttemptId(result.attempt.id);
        setQuestions(result.questions);
        setTimeLeft(result.duration_minutes * 60);

        // Restore saved responses
        const restored: Record<string, any> = {};
        const restoredReviews = new Set<string>();
        for (const r of result.responses) {
          restored[r.question_id] = r.answer_json;
          if (r.marked_for_review) restoredReviews.add(r.question_id);
        }
        setAnswers(restored);
        setReviews(restoredReviews);

        if (result.resumed) {
          const elapsed = Math.floor(
            (Date.now() - new Date(result.attempt.started_at).getTime()) / 1000,
          );
          const remaining = Math.max(0, result.duration_minutes * 60 - elapsed);
          
          endTimeRef.current = Date.now() + (remaining * 1000);
          setTimeLeft(remaining);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load test.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [testId]);

  /* ─── Timer ─── */
  useEffect(() => {
    if (loading) return;
    if (timeLeft <= 0 && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      handleSubmit();
      return;
    }
    
    // Ensure endTime is set
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + (timeLeft * 1000);
    }
    
    timerRef.current = setInterval(() => {
      if (!endTimeRef.current) return;
      const remainingSeconds = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000));
      
      setTimeLeft(remainingSeconds);
      
      if (remainingSeconds <= 0) {
        clearInterval(timerRef.current!);
      }
    }, 500);
    
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, timeLeft === 0]);

  /* ─── Anti-Cheat & Navigation Warning ─── */
  const violationsRef = useRef(0);

  useEffect(() => {
    if (loading || submitting || timeLeft <= 0) return;

    // Push initial state to trap back button
    window.history.pushState(null, "", window.location.href);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You have an ongoing test. Are you sure you want to leave?";
    };

    const handlePopState = (e: PopStateEvent) => {
      const confirmSubmit = window.confirm("You are leaving the test. Do you want to submit the test?");
      if (confirmSubmit) {
        handleSubmit();
      } else {
        // Push state again to block further back navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.href && !target.hasAttribute("download") && target.getAttribute("target") !== "_blank") {
        if (target.href.startsWith(window.location.origin) && target.href !== window.location.href) {
          e.preventDefault();
          e.stopPropagation();
          const confirmSubmit = window.confirm("You are leaving the test. Do you want to submit the test?");
          if (confirmSubmit) {
            handleSubmit();
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        violationsRef.current += 1;
        if (violationsRef.current === 1) {
          toast.error("WARNING: Navigating away from the test window is not allowed.", {
            description: "If you leave this screen again, your test will be automatically submitted."
          });
        } else if (violationsRef.current >= 2) {
          toast.error("Test automatically submitted due to repeated tab switching.");
          handleSubmit();
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loading, submitting, timeLeft]);

  const q = questions[currentIdx];

  /* ─── Save answer to backend ─── */
  const saveToBackend = useCallback(
    async (questionId: string, answerJson: any) => {
      if (!attemptId) return;
      const question = questions.find((qq) => qq.id === questionId);
      if (!question) return;
      setSaving(true);
      try {
        await studentService.saveAnswer(testId, attemptId, {
          test_question_id: question.test_question_id,
          question_id: questionId,
          topic_id: question.topic_id,
          answer_json: answerJson,
          marked_for_review: reviews.has(questionId),
        });
      } catch { /* offline resilient */ }
      finally { setSaving(false); }
    },
    [attemptId, testId, questions, reviews],
  );

  const setAnswer = (answer: any) => {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: answer }));
    saveToBackend(q.id, answer);
  };

  const clearAnswer = () => {
    if (!q) return;
    setAnswers((prev) => { const next = { ...prev }; delete next[q.id]; return next; });
    saveToBackend(q.id, null);
  };

  const toggleReview = () => {
    if (!q) return;
    setReviews((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id); else next.add(q.id);
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      await studentService.submitAttempt(testId, attemptId);
      if (timerRef.current) clearInterval(timerRef.current);
      router.push(`/results/${attemptId}?testId=${testId}&view=result`);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit");
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const reviewCount = reviews.size;
  const unansweredCount = questions.length - answeredCount;

  if (loading) {
    return <AppLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Link href="/tests" className="mt-4 inline-block text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white">← Back to tests</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-[1500ms]">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-lg relative transition-colors duration-[1500ms]">
        <div className="flex items-center w-full">
          {/* Left section (Main Question Area) */}
          <div className="flex-1 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3">
            <div className="flex items-center gap-4">
              {q && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/[0.03] text-xs font-bold">
                  <span className="text-emerald-500">+{q.marks}</span>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <span className="text-red-500">-{q.negative_marks || 0}</span>
                </div>
              )}
            </div>

            {/* Mobile Centered Timer (Visible on mobile only) */}
            <div className="flex lg:hidden items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className={`rounded-xl px-3 py-1 text-base font-mono font-bold tabular-nums pointer-events-auto ${
                timeLeft < 300 ? "bg-red-600/20 text-red-500 dark:text-red-300"
                  : timeLeft < 600 ? "bg-red-500/15 text-red-500 dark:text-red-300"
                  : "bg-black/5 dark:bg-white/[0.05] text-black dark:text-white"
              }`}>{formatTime(timeLeft)}</div>
            </div>

            {/* Mobile right items (Hidden on Desktop) */}
            <div className="flex lg:hidden items-center gap-2">
              <button onClick={() => setShowPalette(!showPalette)} className="rounded-lg border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/[0.03] p-2 text-sm">☰</button>
              <button onClick={toggleTheme} className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition">
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setShowSubmitModal(true)} disabled={submitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>

          {/* Absolute Centered Timer (Desktop) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-3 pointer-events-none">
            <div className={`rounded-xl px-4 py-1.5 text-lg font-mono font-bold tabular-nums pointer-events-auto ${
              timeLeft < 300 ? "bg-red-600/20 text-red-500 dark:text-red-300"
                : timeLeft < 600 ? "bg-red-500/15 text-red-500 dark:text-red-300"
                : "bg-black/5 dark:bg-white/[0.05] text-black dark:text-white"
            }`}>{formatTime(timeLeft)}</div>
          </div>
          
          {/* Right section (Sidebar Area - Desktop Only) */}
          <div className="hidden lg:flex w-72 shrink-0 items-center justify-end px-8 py-3 gap-3">
            <button onClick={toggleTheme} className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setShowSubmitModal(true)} disabled={submitting}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-700 disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* MAIN QUESTION */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-12">
          {q && (
            <div className="max-w-4xl mr-auto">

              <div className="text-black dark:text-white flex gap-4 items-start">
                <div className="shrink-0 flex flex-col items-center gap-2 mt-0.5">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-600/10 text-red-600 dark:text-red-400 font-bold text-sm">
                    {currentIdx + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <ContentBlockRenderer blocks={q.content_json || []} />
                </div>
              </div>
              <div className="mt-4">{renderAnswerInput(q, answers[q.id], setAnswer)}</div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button onClick={clearAnswer} className="rounded-xl border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/[0.03] px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 transition hover:bg-black/10 dark:hover:bg-white/[0.06]">Clear Response</button>
                <button onClick={toggleReview}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${reviews.has(q.id)
                    ? "border-purple-500/40 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-200"
                    : "border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/[0.03] text-zinc-600 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/[0.06]"
                  }`}>
                  {reviews.has(q.id) ? "✓ Marked for Review" : "Mark for Review"}
                </button>
                <div className="flex-1" />
                <button onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))} disabled={currentIdx === 0}
                  className="rounded-xl border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/[0.03] px-5 py-2 text-sm text-zinc-600 dark:text-zinc-300 transition hover:bg-black/10 dark:hover:bg-white/[0.06] disabled:opacity-30">← Previous</button>
                <button onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))} disabled={currentIdx === questions.length - 1}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-200 transition hover:bg-emerald-500/20 dark:hover:bg-emerald-500/15 disabled:opacity-30">Save & Next →</button>
              </div>
            </div>
          )}
        </main>

        {/* SIDEBAR PALETTE */}
        <aside className={`${showPalette ? "block" : "hidden"} lg:block w-72 border-l border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-4 overflow-y-auto transition-colors duration-[1500ms]`}>
          <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Question Palette</h3>
          <div className="grid grid-cols-2 gap-2 mb-4 text-[10px]">
            {([["unanswered","Not Answered"],["answered","Answered"],["review","For Review"],["review-answered","Review + Answered"]] as [QStatus,string][]).map(([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`h-4 w-4 rounded border ${statusColors[status]}`} />
                <span className="text-zinc-600 dark:text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((qq, idx) => {
              const status = getStatus(qq, answers, reviews);
              return (
                <button key={qq.id} onClick={() => { setCurrentIdx(idx); setShowPalette(false); }}
                  className={`h-10 w-10 rounded-lg border text-xs font-medium transition ${statusColors[status]} ${idx === currentIdx ? "ring-2 ring-red-500" : "hover:opacity-80"}`}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex justify-between"><span>Answered</span><span className="text-emerald-600 dark:text-emerald-300">{answeredCount}</span></div>
            <div className="flex justify-between"><span>Unanswered</span><span className="text-zinc-500 dark:text-zinc-300">{unansweredCount}</span></div>
            <div className="flex justify-between"><span>For Review</span><span className="text-purple-600 dark:text-purple-300">{reviewCount}</span></div>
          </div>
        </aside>
      </div>

      {/* SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/80 dark:bg-black/60 backdrop-blur-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h3 className="text-xl font-bold text-black dark:text-white">Submit Test?</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">This action cannot be undone.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-emerald-500/20 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 shadow-inner">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{answeredCount}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-500">Answered</div>
              </div>
              <div className="rounded-2xl bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4 shadow-inner">
                <div className="text-2xl font-black text-zinc-800 dark:text-zinc-200">{unansweredCount}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Unanswered</div>
              </div>
              <div className="rounded-2xl bg-purple-500/20 dark:bg-purple-500/10 border border-purple-500/20 p-4 shadow-inner">
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{reviewCount}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-500">For Review</div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-6 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-black/10 dark:hover:bg-white/10">Cancel</button>
              <button onClick={handleSubmit} className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-700 hover:shadow-red-500/50">Submit Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════ */
function renderAnswerInput(q: AttemptQuestion, currentAnswer: any, setAnswer: (a: any) => void) {
  const options = (q.options_json as any)?.options || [];

  switch (q.question_type) {
    case "SINGLE_CORRECT":
    case "ASSERTION_REASON":
    case "FILL_BLANK":
    case "NUMERICAL":
      if (options.length > 0) {
        return (
          <div className="space-y-3">
            {options.map((opt: any) => (
              <button key={opt.id} onClick={() => setAnswer({ selected_option: opt.id })}
                className={`w-full text-left rounded-xl border p-4 text-sm transition-colors duration-[1500ms] ${
                  currentAnswer?.selected_option === opt.id
                    ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-100"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/[0.06]"
                }`}>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs mr-3">{opt.id}</span>
                <MathRenderer text={opt.text} className="inline" />
              </button>
            ))}
          </div>
        );
      }
      // Fallbacks if options are missing for some reason
      if (q.question_type === "FILL_BLANK") {
        return (
          <input type="text" value={currentAnswer?.blanks?.[0] || ""} onChange={(e) => setAnswer({ blanks: { 0: e.target.value } })}
            placeholder="Type your answer…"
            className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-red-500/50 dark:focus:border-red-500/30" />
        );
      }
      if (q.question_type === "NUMERICAL") {
        return (
          <input type="number" step="any" value={currentAnswer?.value ?? ""} onChange={(e) => setAnswer({ value: e.target.value })}
            placeholder="Enter numerical answer…"
            className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-red-500/50 dark:focus:border-red-500/30" />
        );
      }
      return (
        <textarea value={currentAnswer?.text || ""} onChange={(e) => setAnswer({ text: e.target.value })}
          placeholder="Enter your answer…"
          className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-red-500/50 dark:focus:border-red-500/30 min-h-[120px]" />
      );
    case "MULTIPLE_CORRECT":
      return (
        <div className="space-y-3">
          {options.map((opt: any) => {
            const selected = currentAnswer?.selected_options || [];
            const isSelected = selected.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => {
                const next = isSelected ? selected.filter((s: string) => s !== opt.id) : [...selected, opt.id];
                setAnswer({ selected_options: next });
              }}
                className={`w-full text-left rounded-xl border p-4 text-sm transition-colors duration-[1500ms] ${
                  isSelected ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-100"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/[0.06]"
                }`}>
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded mr-3 border text-xs ${
                  isSelected ? "border-emerald-500 dark:border-emerald-400 bg-emerald-500/20 dark:bg-emerald-500/30" : "border-current"
                }`}>{isSelected ? "✓" : opt.id}</span>
                <MathRenderer text={opt.text} className="inline" />
              </button>
            );
          })}
          <p className="text-xs text-zinc-500">Select all that apply</p>
        </div>
      );
    case "TRUE_FALSE":
      if (options.length > 0) {
        return (
          <div className="flex gap-4">
            {options.map((opt: any) => (
              <button key={opt.id} onClick={() => setAnswer({ selected_option: opt.id })}
                className={`flex-1 rounded-xl border p-4 text-center text-sm font-medium transition-colors duration-[1500ms] ${
                  currentAnswer?.selected_option === opt.id
                    ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-100"
                    : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/[0.06]"
                }`}><MathRenderer text={opt.text} className="inline" /></button>
            ))}
          </div>
        );
      }
      return (
        <div className="flex gap-4">
          {["True", "False"].map((val) => (
            <button key={val} onClick={() => setAnswer({ answer: val === "True" })}
              className={`flex-1 rounded-xl border p-4 text-center text-sm font-medium transition-colors duration-[1500ms] ${
                currentAnswer?.answer === (val === "True")
                  ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-100"
                  : "border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/[0.06]"
              }`}>{val}</button>
          ))}
        </div>
      );
    default:
      return (
        <textarea value={currentAnswer?.text || ""} onChange={(e) => setAnswer({ text: e.target.value })}
          placeholder="Enter your answer…"
          className="w-full rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-4 py-3 text-black dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-red-500/50 dark:focus:border-red-500/30 min-h-[120px]" />
      );
  }
}
