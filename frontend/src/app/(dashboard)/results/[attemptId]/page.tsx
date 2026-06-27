"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import MathRenderer from "@/components/ui/MathRenderer";
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
  const viewMode = searchParams.get("view") || "result";

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
          <Link href="/student/dashboard" className="mt-4 inline-block text-red-400 hover:text-red-300">← Back to dashboard</Link>
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
  
  const calculatedTotalMarks = testQuestions.reduce((acc: number, tq: any) => acc + (data.test?.positive_marks || tq.marks_override || tq.question.marks), 0) || data.test?.total_marks;


  return (
    <>
        <SectionTitle 
          title={data.test?.title || (viewMode === "analysis" ? "Test Analysis" : "Test Result")} 
        />

        {/* Subtle Single Line Summary */}
        {viewMode !== "analysis" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-2 text-[13px]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400">Score:</span>
                <span className="font-semibold text-white">{data.score ?? 0}</span>
                <span className="text-zinc-500">/ {calculatedTotalMarks}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400">Rank:</span>
                <span className="font-semibold text-white">{data.rank ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400">Questions:</span>
                <span className="font-semibold text-white">{testQuestions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400">Passing Marks:</span>
                <span className="font-semibold text-white">{data.test?.passing_marks ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400">Accuracy:</span>
                <span className="font-semibold text-white">{responses.length > 0 ? Math.round((correct / responses.length) * 100) : 0}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-400">Time:</span>
                <span className="font-semibold text-white">{timeTaken}</span>
              </div>
            </div>
            <div className="flex items-center gap-5 text-xs font-medium">
              <span className="text-emerald-400 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>{correct} Correct</span>
              <span className="text-red-400 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>{wrong} Wrong</span>
              <span className="text-amber-400 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>{skipped} Skipped</span>
            </div>
          </div>
        )}

        {/* Question-by-question breakdown */}
        {viewMode !== "analysis" && <h3 className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-2">Question-by-Question Review</h3>}

        <div className="flex flex-col lg:flex-row gap-4 mt-2">
          
          {/* Main Question Display */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {testQuestions.length > 0 && testQuestions[activeQuestionIdx] ? (
              (() => {
                const idx = activeQuestionIdx;
                const tq = testQuestions[idx];
                const q = tq.question;
                const r = responses.find((resp: any) => resp.question_id === q.id);

                return (
                  <Panel className="p-0 overflow-hidden flex flex-col h-full border border-white/10 relative">
                    {/* Header */}
                    <div className="bg-zinc-900/80 text-white flex items-center justify-between px-5 py-2.5 shrink-0 border-b border-white/10 shadow-sm">
                      <div className="font-bold text-[15px] text-white">Question {idx + 1}</div>
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="bg-zinc-800/80 px-2.5 py-0.5 rounded-full text-xs">
                          Marks: <span className="text-emerald-400">+{data.test?.positive_marks || tq.marks_override || q.marks}</span> | <span className="text-red-400">-{data.test?.negative_marks ?? q.negative_marks ?? 0}</span>
                        </span>
                        {viewMode !== "analysis" && (
                          <span className={`px-2.5 py-0.5 rounded-full border text-xs ${
                              r?.is_correct === true ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : r?.is_correct === false ? "bg-red-500/10 border-red-500/30 text-red-400"
                                : "bg-zinc-800 border-zinc-700 text-zinc-400"
                            }`}>
                            {r?.is_correct === true ? "Correct" : r?.is_correct === false ? "Incorrect" : "Skipped"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 relative bg-[#0a0a0a]">
                      
                      {/* Question Content */}
                      <div className="text-[14px] font-medium text-zinc-200 mb-4 w-full leading-relaxed">
                        <ContentBlockRenderer blocks={q.content_json || []} />
                      </div>

                      {/* Options */}
                      <div className="space-y-1.5 w-full mb-4">
                        {(() => {
                          const optionsToRender = q.options_json?.options || [];

                          if (optionsToRender.length === 0) {
                            if (q.question_type === "TRUE_FALSE") {
                              const opts = ["True", "False"];
                              return opts.map(opt => {
                                const isCorrectOption = q.answer_key?.answer === (opt === "True");
                                const isSelectedOption = viewMode === "result" && r?.answer_json?.answer === (opt === "True");
                                
                                let borderColor = "border-white/10";
                                let bgColor = "bg-white/[0.02]";
                                let icon = null;

                                if (isCorrectOption) {
                                  borderColor = "border-emerald-500";
                                  bgColor = "bg-emerald-500/10";
                                  icon = <span className="text-emerald-500 ml-auto font-bold text-lg">✓</span>;
                                } else if (isSelectedOption) {
                                  borderColor = "border-red-500";
                                  bgColor = "bg-red-500/10";
                                  icon = <span className="text-red-500 ml-auto font-bold text-lg">✗</span>;
                                }

                                return (
                                  <div key={opt} className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${borderColor} ${bgColor}`}>
                                    <div className="text-zinc-200 text-sm flex-1">{opt}</div>
                                    {icon}
                                  </div>
                                );
                              });
                            }

                            if (q.question_type === "FILL_BLANK") {
                               const studentBlanks = r?.answer_json?.blanks || {};
                               const correctBlanks = q.answer_key?.blanks || [];
                               return correctBlanks.map((blank: any, i: number) => {
                                  const studentVal = studentBlanks[blank.position] || "";
                                  const expected = blank.answer;
                                  const match = blank.case_sensitive
                                    ? studentVal === expected
                                    : studentVal.toLowerCase() === expected.toLowerCase();
                                  
                                  return (
                                    <div key={i} className={`p-4 rounded-xl border-2 transition-all ${match ? "border-emerald-500 bg-emerald-500/10" : "border-red-500 bg-red-500/10"}`}>
                                      <div className="text-xs uppercase text-zinc-500 mb-1">Blank {blank.position}</div>
                                      {viewMode === "result" && <div className="text-zinc-200">Your Answer: <span className={match ? "text-emerald-400" : "text-red-400"}>{studentVal || "—"}</span></div>}
                                      {(!match || viewMode === "analysis") && viewMode === "analysis" && <div className="text-emerald-400 mt-1">Correct Answer: {expected}</div>}
                                    </div>
                                  );
                               });
                            }

                            if (q.question_type === "NUMERICAL") {
                               const studentVal = r?.answer_json?.value;
                               const expected = q.answer_key?.value;
                               const diff = Math.abs(Number(studentVal) - Number(expected));
                               const tolerance = q.answer_key?.tolerance || 0;
                               const match = studentVal !== undefined && studentVal !== null && diff <= tolerance;

                               return (
                                  <div key="numerical" className={`p-4 rounded-xl border-2 transition-all ${match && viewMode === "result" ? "border-emerald-500 bg-emerald-500/10" : !match && viewMode === "result" ? "border-red-500 bg-red-500/10" : "border-emerald-500 bg-emerald-500/10"}`}>
                                    {viewMode === "result" && <div className="text-zinc-200">Your Answer: <span className={match ? "text-emerald-400" : "text-red-400"}>{studentVal ?? "—"}</span></div>}
                                    {(!match || viewMode === "analysis") && viewMode === "analysis" && <div className="text-emerald-400 mt-1">Correct Answer: {expected} {tolerance > 0 ? `(±${tolerance})` : ""}</div>}
                                  </div>
                               );
                            }

                            // Fallback for subjective/unknown
                            return (
                               <div key="subjective" className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                                 <div className="text-zinc-200">Your Answer:</div>
                                 <div className="text-zinc-400 mt-2">{r?.answer_json?.text || "—"}</div>
                               </div>
                            );
                          }

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
                            if (viewMode === "result") {
                              if (Array.isArray(r?.answer_json?.selected_options)) {
                                isSelectedOption = r.answer_json.selected_options.includes(opt.id);
                              } else {
                                isSelectedOption = r?.answer_json?.selected_option === opt.id;
                              }
                            }
                            
                            let borderColor = "border-white/10";
                            let bgColor = "bg-white/[0.02]";
                            let icon = null;

                            if (isCorrectOption) {
                              borderColor = "border-emerald-500";
                              bgColor = "bg-emerald-500/10";
                              icon = <span className="text-emerald-500 ml-auto font-bold text-lg">✓</span>;
                            } else if (isSelectedOption) {
                              borderColor = "border-red-500";
                              bgColor = "bg-red-500/10";
                              icon = <span className="text-red-500 ml-auto font-bold text-lg">✗</span>;
                            }

                            return (
                              <div 
                                key={opt.id} 
                                className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${borderColor} ${bgColor}`}
                              >
                                <MathRenderer text={opt.text} className="inline text-zinc-200 text-sm flex-1" />
                                {icon}
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Solution */}
                      {q.solution_json && (
                        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 mt-3">
                          <div className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5 font-bold flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Solution & Explanation
                          </div>
                          <div className="text-xs text-zinc-300 leading-relaxed">
                            {typeof q.solution_json === 'string' ? q.solution_json : <ContentBlockRenderer blocks={Array.isArray(q.solution_json) ? q.solution_json : []} />}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-6 border-t border-white/10 pt-4">
                        <button
                          onClick={() => setChallengeQ({ ...q, responseId: r?.id })}
                          className="text-xs uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition flex items-center gap-2"
                        >
                          Review
                        </button>
                        <div className="text-xs text-zinc-500 text-right">
                          {q.topic?.chapter?.section?.test_series?.name || q.topic?.chapter?.section?.course?.name || "Course"} → {q.topic?.chapter?.name} → {q.topic?.name}
                        </div>
                      </div>

                    </div>
                    
                    {/* Navigation Footer */}
                    <div className="bg-zinc-900 border-t border-white/10 p-3 shrink-0 flex items-center justify-between">
                      <button 
                        onClick={() => setActiveQuestionIdx(Math.max(0, idx - 1))}
                        disabled={idx === 0}
                        className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-xs font-medium text-white transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        ← Previous
                      </button>
                      <div className="text-xs text-zinc-400 font-medium">
                        {idx + 1} of {testQuestions.length}
                      </div>
                      <button 
                        onClick={() => setActiveQuestionIdx(Math.min(testQuestions.length - 1, idx + 1))}
                        disabled={idx === testQuestions.length - 1}
                        className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg shadow-md text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
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
          <div className="w-full lg:w-[280px] shrink-0">
            <Panel className="p-0 overflow-hidden sticky top-6">
              
              <div className="h-12 bg-zinc-900 border-b border-white/10 text-white flex items-center px-5 text-sm font-bold shadow-inner">
                Test Navigation
              </div>

              {/* Legend */}
              {viewMode !== "analysis" && (
                <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-white/5 bg-zinc-900/50">
                  <div className="flex items-center gap-2"><div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-bold shadow-sm">✓</div> <span className="text-zinc-400">Correct</span></div>
                  <div className="flex items-center gap-2"><div className="w-5 h-5 rounded flex items-center justify-center bg-red-500/20 border border-red-500/50 text-red-400 font-bold shadow-sm">✗</div> <span className="text-zinc-400">Incorrect</span></div>
                  <div className="flex items-center gap-2 col-span-2 mt-1"><div className="w-5 h-5 rounded flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-500 font-bold shadow-sm">—</div> <span className="text-zinc-400">Skipped</span></div>
                </div>
              )}

              {/* Question Grid */}
              <div className="p-4 bg-black/20 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-5 gap-2">
                  {testQuestions.map((tq: any, idx: number) => {
                    const q = tq.question;
                    const r = responses.find((resp: any) => resp.question_id === q.id);
                    const isCurrent = activeQuestionIdx === idx;
                    
                    let bgClass = "bg-zinc-800 text-zinc-400 border border-zinc-700";
                    if (viewMode !== "analysis") {
                      if (r?.is_correct === true) bgClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
                      if (r?.is_correct === false) bgClass = "bg-red-500/20 text-red-400 border border-red-500/30";
                    }

                    return (
                      <button
                        key={tq.id}
                        onClick={() => setActiveQuestionIdx(idx)}
                        className={`w-full aspect-square flex items-center justify-center rounded-lg text-sm font-bold shadow-sm transition hover:scale-105 ${bgClass} ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-white/50' : ''}`}
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

        <div className="mt-8 flex justify-center">
          {data.test?.topic?.chapter?.section?.test_series_id ? (
            <Link href={`/test-series/${data.test.topic.chapter.section.test_series_id}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white">← Back to Test Series</Link>
          ) : data.test?.topic?.chapter?.section?.course_id ? (
            <Link href={`/courses/${data.test.topic.chapter.section.course_id}`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white">← Back to Course</Link>
          ) : (
            <Link href="/student/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white">← Back to dashboard</Link>
          )}
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
                <h3 className="text-lg font-semibold text-white mb-1">Review Question</h3>
                <p className="text-sm text-zinc-400 mb-4">Are you sure you want to flag this question for review?</p>

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
                      placeholder="Reason for review..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-red-500/30 min-h-[100px]" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { setChallengeQ(null); setChallengeDesc(""); }}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white">Cancel</button>
                  <button onClick={handleChallenge} disabled={challengeLoading || !challengeDesc.trim()}
                    className="rounded-xl bg-zinc-800 border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50">
                    {challengeLoading ? "Submitting…" : "Submit Review"}
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
