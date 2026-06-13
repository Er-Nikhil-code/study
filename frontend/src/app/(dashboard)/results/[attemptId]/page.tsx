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

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // New UI state
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Challenge modal
  const [challengeQ, setChallengeQ] = useState<any>(null);
  const [challengeReason, setChallengeReason] = useState(CHALLENGE_REASONS[0].value);
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
        <div className="h-8 w-48 hidden rounded bg-white/10" />
        <div className="mt-4 h-64 hidden rounded-2xl bg-white/[0.03]" />
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
  const testQuestions = data.test?.test_questions || [];
  const correct = responses.filter((r: any) => r.is_correct === true).length;
  const wrong = responses.filter((r: any) => r.is_correct === false).length;
  const skipped = Math.max(0, testQuestions.length - responses.length);
  const timeTaken = data.time_taken_sec ? `${Math.floor(data.time_taken_sec / 60)}m ${data.time_taken_sec % 60}s` : "—";
  
  const calculatedTotalMarks = testQuestions.reduce((acc: number, tq: any) => acc + (tq.marks_override ?? tq.question.marks), 0) || data.test?.total_marks;


  return (
    <>
        <SectionTitle title={data.test?.title || "Test Result"} subtitle={`Attempt #${data.attempt_no} · ${data.practice_mode ? "Practice" : "Scored"}`} />

        {/* Score summary */}
        <Panel accent className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm text-zinc-400">Overall Score</div>
              <div className="mt-2 text-4xl font-semibold tracking-tight text-white">
                {data.score ?? 0}<span className="text-zinc-500 text-2xl">/{calculatedTotalMarks}</span>
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

        <div className="flex flex-col lg:flex-row gap-6 mt-4">
          
          {/* Main Question Display */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {testQuestions.length > 0 && testQuestions[activeQuestionIdx] ? (
              (() => {
                const idx = activeQuestionIdx;
                const tq = testQuestions[idx];
                const q = tq.question;
                const r = responses.find((resp: any) => resp.question_id === q.id);

                return (
                  <Panel className="p-0 overflow-hidden flex flex-col h-full border border-white/10 relative">
                    {/* Header */}
                    <div className="bg-zinc-900/80 text-white flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/10 shadow-sm">
                      <div className="font-bold text-lg text-blue-400">Question {idx + 1}</div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="bg-zinc-800 px-3 py-1 rounded-full">
                          Marks: <span className="text-emerald-400">+{tq.marks_override ?? q.marks}</span> | <span className="text-red-400">-{q.negative_marks ?? 0}</span>
                        </span>
                        <span className={`px-3 py-1 rounded-full border ${
                            r?.is_correct === true ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : r?.is_correct === false ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400"
                          }`}>
                          {r?.is_correct === true ? "Correct" : r?.is_correct === false ? "Incorrect" : "Skipped"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 relative bg-zinc-950/30">
                      
                      {/* Question Content */}
                      <div className="text-lg font-medium text-zinc-200 mb-8 w-full leading-relaxed">
                        <ContentBlockRenderer blocks={q.content_json || []} />
                      </div>

                      {/* Options */}
                      <div className="space-y-3 w-full mb-8">
                        {(() => {
                          const optionsToRender = q.options_json?.options || [];

                          return optionsToRender.map((opt: any) => {
                            let isCorrectOption = false;
                            let isSelectedOption = false;

                            // Check correct options
                            if (Array.isArray(q.answer_key?.correct_options)) {
                              isCorrectOption = q.answer_key.correct_options.includes(opt.id);
                            } else {
                              isCorrectOption = q.answer_key?.correct_option === opt.id;
                            }
                            
                            // Check selected options
                            if (Array.isArray(r?.answer_json?.correct_options)) {
                              isSelectedOption = r.answer_json.correct_options.includes(opt.id);
                            } else {
                              isSelectedOption = r?.answer_json?.correct_option === opt.id;
                            }
                            
                            let borderColor = "border-white/10";
                            let bgColor = "bg-white/[0.02]";
                            let icon = null;

                            if (isCorrectOption) {
                              borderColor = "border-emerald-500";
                              bgColor = "bg-emerald-500/10";
                              icon = <span className="text-emerald-500 ml-auto font-bold text-lg">✓</span>;
                            } else if (isSelectedOption && !isCorrectOption) {
                              borderColor = "border-red-500";
                              bgColor = "bg-red-500/10";
                              icon = <span className="text-red-500 ml-auto font-bold text-lg">✗</span>;
                            }

                            return (
                              <div 
                                key={opt.id} 
                                className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${borderColor} ${bgColor}`}
                              >
                                <div className="text-zinc-200 text-base flex-1">{opt.text}</div>
                                {icon}
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Solution */}
                      {q.solution_json && (
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 mt-8 mb-6">
                          <div className="text-xs uppercase tracking-wide text-blue-400 mb-3 font-semibold flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Solution & Explanation
                          </div>
                          <div className="text-sm text-zinc-300 leading-relaxed">
                            {typeof q.solution_json === 'string' ? q.solution_json : <ContentBlockRenderer blocks={Array.isArray(q.solution_json) ? q.solution_json : []} />}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-8 border-t border-white/10 pt-6">
                        <button
                          onClick={() => setChallengeQ({ ...q, responseId: r?.id })}
                          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 flex items-center gap-2"
                        >
                          ⚡ Challenge This Question
                        </button>
                        <div className="text-xs text-zinc-500 text-right">
                          {q.topic?.chapter?.section?.course?.name ?? "Course"} → {q.topic?.chapter?.name} → {q.topic?.name}
                        </div>
                      </div>

                    </div>
                    
                    {/* Navigation Footer */}
                    <div className="bg-zinc-900 border-t border-white/10 p-4 shrink-0 flex items-center justify-between">
                      <button 
                        onClick={() => setActiveQuestionIdx(Math.max(0, idx - 1))}
                        disabled={idx === 0}
                        className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-sm font-medium text-white transition disabled:opacity-50 flex items-center gap-2"
                      >
                        ← Previous
                      </button>
                      <div className="text-sm text-zinc-400 font-medium">
                        {idx + 1} of {testQuestions.length}
                      </div>
                      <button 
                        onClick={() => setActiveQuestionIdx(Math.min(testQuestions.length - 1, idx + 1))}
                        disabled={idx === testQuestions.length - 1}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md text-sm font-bold transition flex items-center gap-2 disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>

                  </Panel>
                );
              })()
            ) : (
              <Panel className="flex items-center justify-center p-12 text-zinc-500">
                No questions available for this test.
              </Panel>
            )}
          </div>

          {/* Right Palette Area */}
          <div className="w-full lg:w-80 shrink-0">
            <Panel className="p-0 overflow-hidden sticky top-6">
              
              <div className="h-12 bg-blue-600 text-white flex items-center px-5 text-sm font-bold shadow-inner">
                Test Navigation
              </div>

              {/* Legend */}
              <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-white/5 bg-zinc-900/50">
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold shadow-sm">✓</div> <span className="text-zinc-400">Correct</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 rounded flex items-center justify-center bg-red-500/20 border border-red-500/50 text-red-400 font-bold shadow-sm">✗</div> <span className="text-zinc-400">Incorrect</span></div>
                <div className="flex items-center gap-2 col-span-2 mt-1"><div className="w-5 h-5 rounded flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-500 font-bold shadow-sm">—</div> <span className="text-zinc-400">Skipped</span></div>
              </div>

              {/* Question Grid */}
              <div className="p-5 bg-black/20 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-5 gap-3">
                  {testQuestions.map((tq: any, idx: number) => {
                    const q = tq.question;
                    const r = responses.find((resp: any) => resp.question_id === q.id);
                    const isCurrent = activeQuestionIdx === idx;
                    
                    let bgClass = "bg-zinc-800 text-zinc-400 border border-zinc-700";
                    if (r?.is_correct === true) bgClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
                    if (r?.is_correct === false) bgClass = "bg-red-500/20 text-red-400 border border-red-500/30";

                    return (
                      <button
                        key={tq.id}
                        onClick={() => setActiveQuestionIdx(idx)}
                        className={`w-full aspect-square flex items-center justify-center rounded-lg text-sm font-bold shadow-sm transition hover:scale-105 ${bgClass} ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-blue-500' : ''}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Panel>
          </div>
          
        </div>

        <div className="mt-8">
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
