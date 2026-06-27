"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TestsService } from "@/services/tests.service";
import { ChallengesService } from "@/services/challenges.service";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import MathRenderer from "@/components/ui/MathRenderer";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trophy,
  Target,
  Flag,
  Home,
  BookOpen,
  Minus,
} from "lucide-react";

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const attemptId = params.attemptId as string;

  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [challengeQid, setChallengeQid] = useState<string | null>(null);
  const [challengeReason, setChallengeReason] = useState("WRONG_ANSWER_KEY");
  const [challengeDesc, setChallengeDesc] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["test", testId, "attempt", attemptId, "result"],
    queryFn: () => TestsService.getAttemptResult(attemptId),
  });

  const challengeMutation = useMutation({
    mutationFn: (payload: any) => ChallengesService.create(payload),
    onSuccess: () => {
      alert("Challenge submitted successfully. Our Knights will review it.");
      setChallengeQid(null);
      setChallengeDesc("");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Failed to submit challenge.");
    },
  });

  const handleChallengeSubmit = (
    e: React.FormEvent,
    questionId: string,
    responseId: string
  ) => {
    e.preventDefault();
    challengeMutation.mutate({
      question_id: questionId,
      response_id: responseId,
      reason: challengeReason,
      description: challengeDesc,
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm">Loading Analysis...</p>
        </div>
      </div>
    );
  }

  if (!res?.data) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 text-red-400">
        Failed to load results.
      </div>
    );
  }

  const { attempt, test } = res.data;
  const responses = attempt.responses || [];
  const questions = test.test_questions || [];

  const correct = responses.filter((r: any) => r.is_correct === true).length;
  const incorrect = responses.filter((r: any) => r.is_correct === false).length;
  const total = questions.length;
  const unattempted = total - correct - incorrect;
  const percentage = attempt.max_score
    ? Math.round((attempt.score / attempt.max_score) * 100)
    : 0;

  const currentTq = questions[activeQuestionIdx];
  const currentQ = currentTq?.question;
  const currentResponse = responses.find(
    (r: any) => r.test_question_id === currentTq?.id
  );

  const isCurrentCorrect = currentResponse?.is_correct === true;
  const isCurrentIncorrect = currentResponse?.is_correct === false;
  const isCurrentUnattempted =
    !currentResponse || currentResponse.is_correct === null;

  const studentAnsId =
    currentResponse?.answer_json?.selected_option ||
    currentResponse?.answer_json?.answer;
  const correctAnsId =
    currentQ?.answer_key?.correct_option || currentQ?.answer_key?.answer;

  // Palette color per question
  const getQuestionPaletteStyle = (tq: any) => {
    const resp = responses.find((r: any) => r.test_question_id === tq.id);
    if (!resp || resp.is_correct === null) return "bg-zinc-400 text-zinc-900"; // unattempted
    if (resp.is_correct === true) return "bg-emerald-500 text-white";
    return "bg-red-500 text-white";
  };

  const getPaletteShape = (tq: any) => {
    const resp = responses.find((r: any) => r.test_question_id === tq.id);
    if (!resp || resp.is_correct === null) return "rounded";
    if (resp.is_correct === true) return "rounded-t-lg";
    return "rounded-b-lg";
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white text-zinc-900 select-none overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-zinc-900 text-white flex items-center justify-between px-6 shrink-0 border-b border-zinc-800 shadow-sm">
        <div className="font-bold text-xl tracking-tight text-emerald-400 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Test Analysis
        </div>

        <div className="flex items-center gap-6 text-sm">
          {/* Score chips */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">{correct}</span>
              <span className="text-emerald-600 text-xs">Correct</span>
            </div>
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-bold">{incorrect}</span>
              <span className="text-red-600 text-xs">Incorrect</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-700/50 px-3 py-1.5 rounded-lg border border-zinc-600/30">
              <Minus className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-300 font-bold">{unattempted}</span>
              <span className="text-zinc-500 text-xs">Skipped</span>
            </div>
          </div>

          <div className="w-px h-6 bg-zinc-700" />

          {/* Score */}
          <div className="flex items-center gap-2 bg-zinc-800/80 px-4 py-2 rounded-lg border border-zinc-700">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-lg font-bold font-mono text-blue-400">
              {attempt.score}
            </span>
            <span className="text-zinc-500 text-xs">/ {attempt.max_score}</span>
            <span className="text-zinc-400 text-xs ml-1">({percentage}%)</span>
          </div>

          <div className="w-px h-6 bg-zinc-700" />

          <button
            onClick={() => router.push("/student/tests")}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg border border-zinc-700 transition text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Exit
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden bg-zinc-100">

        {/* Left Content Area */}
        <div className="flex-1 flex flex-col min-w-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-10 border-r border-zinc-300 bg-white">

          {/* Question Header */}
          <div
            className={`h-14 text-white flex items-center justify-between px-6 shrink-0 ${
              isCurrentCorrect
                ? "bg-emerald-600"
                : isCurrentIncorrect
                ? "bg-red-600"
                : "bg-zinc-500"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">
                Question No. {activeQuestionIdx + 1}
              </span>
              {isCurrentCorrect && (
                <span className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3.5 h-3.5" /> Correct
                </span>
              )}
              {isCurrentIncorrect && (
                <span className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                  <XCircle className="w-3.5 h-3.5" /> Incorrect
                </span>
              )}
              {isCurrentUnattempted && (
                <span className="flex items-center gap-1 text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                  <Minus className="w-3.5 h-3.5" /> Not Attempted
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm font-medium">
              <span>
                Marks:{" "}
                <span className="text-emerald-300">
                  +{currentTq?.marks_override || currentQ?.marks}
                </span>{" "}
                |{" "}
                <span className="text-red-300">-{currentQ?.negative_marks}</span>
              </span>
              {!isCurrentUnattempted && (
                <span className="text-white/80 text-xs">
                  Scored:{" "}
                  <span
                    className={`font-bold ${
                      isCurrentCorrect ? "text-emerald-300" : "text-red-300"
                    }`}
                  >
                    {currentResponse?.marks_obtained > 0
                      ? `+${currentResponse?.marks_obtained}`
                      : currentResponse?.marks_obtained}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Question Body */}
          <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="absolute top-8 right-8 text-xs font-mono text-zinc-300">
              ID: {currentQ?.id?.split("-")[0]}
            </div>

            {/* Question Text */}
            <div className="text-lg font-medium text-zinc-800 mb-8 max-w-4xl leading-relaxed">
              <ContentBlockRenderer blocks={currentQ?.content_json || []} />
            </div>

            {/* Options */}
            <div className="space-y-3 max-w-2xl mb-8">
              {currentQ?.options_json?.options?.map((opt: any) => {
                let isActualCorrect = false;
                let isStudentMarked = false;

                if (Array.isArray(currentQ.answer_key?.correct_options)) {
                  isActualCorrect =
                    currentQ.answer_key.correct_options.includes(opt.id);
                } else {
                  isActualCorrect = correctAnsId === opt.id;
                }

                if (
                  Array.isArray(
                    currentResponse?.answer_json?.selected_options
                  )
                ) {
                  isStudentMarked =
                    currentResponse.answer_json.selected_options.includes(
                      opt.id
                    );
                } else {
                  isStudentMarked = studentAnsId === opt.id;
                }

                let borderCls = "border-zinc-200";
                let bgCls = "bg-white";
                let rightEl: React.ReactNode = null;

                if (isActualCorrect && isStudentMarked) {
                  // Student picked correctly
                  borderCls = "border-emerald-500";
                  bgCls = "bg-emerald-50";
                  rightEl = (
                    <span className="text-emerald-600 ml-auto font-bold text-lg shrink-0">
                      ✓
                    </span>
                  );
                } else if (isActualCorrect) {
                  // Correct answer student missed
                  borderCls = "border-emerald-400";
                  bgCls = "bg-emerald-50/50";
                  rightEl = (
                    <span className="text-emerald-500 ml-auto font-bold text-lg shrink-0">
                      ✓
                    </span>
                  );
                } else if (isStudentMarked && !isActualCorrect) {
                  // Student picked wrong
                  borderCls = "border-red-500";
                  bgCls = "bg-red-50";
                  rightEl = (
                    <span className="text-red-500 ml-auto font-bold text-lg shrink-0">
                      ✗
                    </span>
                  );
                }

                return (
                  <div
                    key={opt.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${borderCls} ${bgCls}`}
                  >
                    <MathRenderer
                      text={opt.text}
                      className="inline text-zinc-800 text-base flex-1"
                    />
                    {rightEl}
                  </div>
                );
              })}
            </div>

            {/* Solution */}
            <div className="max-w-2xl border border-zinc-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 bg-zinc-100 px-5 py-3 border-b border-zinc-200">
                <BookOpen className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  Solution / Explanation
                </span>
              </div>
              <div className="p-5 bg-white">
                {currentQ?.solution_json && currentQ.solution_json.length > 0 ? (
                  <div className="text-sm text-zinc-700">
                    <ContentBlockRenderer blocks={currentQ.solution_json} />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic">
                    No solution provided by the creator.
                  </p>
                )}
              </div>
            </div>

            {/* Challenge Form */}
            <div className="max-w-2xl mt-4">
              <button
                onClick={() =>
                  setChallengeQid(
                    challengeQid === currentQ?.id ? null : currentQ?.id
                  )
                }
                className="flex items-center gap-2 text-xs font-medium text-yellow-700 hover:text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 px-4 py-2 rounded-lg transition"
              >
                <Flag className="w-3.5 h-3.5" />
                {challengeQid === currentQ?.id
                  ? "Cancel Challenge"
                  : "Challenge this Question"}
              </button>

              {challengeQid === currentQ?.id && (
                <form
                  onSubmit={(e) =>
                    handleChallengeSubmit(e, currentQ?.id, currentResponse?.id)
                  }
                  className="mt-3 p-5 bg-yellow-50 border border-yellow-200 rounded-xl space-y-4"
                >
                  <h4 className="text-sm font-bold text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    File a Challenge
                  </h4>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1 font-medium">
                      Reason
                    </label>
                    <select
                      value={challengeReason}
                      onChange={(e) => setChallengeReason(e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm text-zinc-800 outline-none focus:border-yellow-500"
                    >
                      <option value="WRONG_ANSWER_KEY">Wrong Answer Key</option>
                      <option value="AMBIGUOUS_QUESTION">
                        Ambiguous Question
                      </option>
                      <option value="WRONG_EXPLANATION">Wrong Explanation</option>
                      <option value="TYPO">Typo / Grammatical Error</option>
                      <option value="UNCLEAR_WORDING">Unclear Wording</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-500 mb-1 font-medium">
                      Description (Be specific)
                    </label>
                    <textarea
                      required
                      value={challengeDesc}
                      onChange={(e) => setChallengeDesc(e.target.value)}
                      rows={3}
                      placeholder="Explain why you are challenging this question..."
                      className="w-full bg-white border border-zinc-300 rounded p-3 text-sm text-zinc-800 outline-none focus:border-yellow-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setChallengeQid(null)}
                      className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={challengeMutation.isPending}
                      className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded shadow-sm transition disabled:opacity-50"
                    >
                      {challengeMutation.isPending
                        ? "Submitting..."
                        : "Submit Challenge"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="h-16 bg-zinc-50 border-t border-zinc-200 px-6 shrink-0 flex items-center justify-between">
            <button
              onClick={() =>
                setActiveQuestionIdx((i) => Math.max(0, i - 1))
              }
              disabled={activeQuestionIdx === 0}
              className="px-6 py-2 bg-white border border-zinc-300 rounded shadow-sm hover:bg-zinc-100 text-sm font-medium text-zinc-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <span className="text-sm text-zinc-500">
              {activeQuestionIdx + 1} / {questions.length}
            </span>

            <button
              onClick={() =>
                setActiveQuestionIdx((i) =>
                  Math.min(questions.length - 1, i + 1)
                )
              }
              disabled={activeQuestionIdx === questions.length - 1}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-md text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right Palette Area */}
        <div className="w-80 flex flex-col shrink-0 bg-white border-l border-zinc-200 z-0">

          {/* Score Summary */}
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 space-y-3">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Score Summary
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900">
                  {attempt.score}
                  <span className="text-sm font-normal text-zinc-400">
                    /{attempt.max_score}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">Score</div>
              </div>
              <div className="w-px h-10 bg-zinc-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {percentage}%
                </div>
                <div className="text-xs text-zinc-500">Accuracy</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 grid grid-cols-3 gap-2 text-xs border-b border-zinc-200 bg-zinc-50/30">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-white rounded-t font-bold text-[10px]">
                {correct}
              </div>
              <span className="text-zinc-600">Correct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-b font-bold text-[10px]">
                {incorrect}
              </div>
              <span className="text-zinc-600">Wrong</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 flex items-center justify-center bg-zinc-400 text-white rounded font-bold text-[10px]">
                {unattempted}
              </div>
              <span className="text-zinc-600">Skipped</span>
            </div>
          </div>

          <div className="h-8 bg-blue-500 text-white flex items-center px-4 text-sm font-bold shadow-inner">
            {test.topic?.name || test.title}
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-blue-50/30">
            <div className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">
              Review a Question
            </div>
            <div className="grid grid-cols-4 gap-3">
              {questions.map((tq: any, idx: number) => {
                const isCurrent = activeQuestionIdx === idx;
                return (
                  <button
                    key={tq.id}
                    onClick={() => {
                      setActiveQuestionIdx(idx);
                      setChallengeQid(null);
                    }}
                    className={`w-full aspect-square flex items-center justify-center text-sm font-bold shadow-sm transition hover:scale-105 ${getQuestionPaletteStyle(tq)} ${getPaletteShape(tq)} ${
                      isCurrent
                        ? "ring-2 ring-offset-2 ring-blue-500"
                        : ""
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exit to tests list */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50">
            <button
              onClick={() => router.push("/student/tests")}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
