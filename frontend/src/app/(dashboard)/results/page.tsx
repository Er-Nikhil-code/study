"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import studentService, { type ResultItem } from "@/services/student.service";

export default function ResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [page, setPage] = useState(0);
  const [viewChallenge, setViewChallenge] = useState<any>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const PAGE_SIZE = 15;

  useEffect(() => {
    setLoading(true);
    studentService
      .getResults({ page: page + 1, limit: PAGE_SIZE })
      .then((res) => { setResults(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    studentService
      .getMyChallenges()
      .then((data) => setChallenges(data))
      .catch(() => {})
      .finally(() => setLoadingChallenges(false));
  }, []);

  const handleWithdraw = async (challengeId: string) => {
    if (!confirm("Are you sure you want to withdraw this challenge?")) return;
    setWithdrawingId(challengeId);
    try {
      await studentService.withdrawChallenge(challengeId);
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
      if (viewChallenge?.id === challengeId) setViewChallenge(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to withdraw challenge");
    } finally {
      setWithdrawingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left Column: Results */}
      <div>
        <SectionTitle title="Results" subtitle={`${total} attempt${total !== 1 ? "s" : ""} recorded.`} />

        <Panel className="mt-6 overflow-x-auto p-0">
          <div className="min-w-full">
            <div className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_60px] gap-3 border-b border-white/10 px-6 py-5 text-[10px] uppercase tracking-[0.2em] text-zinc-500 bg-white/[0.02]">
              <div className="text-left font-semibold">Test</div>
              <div className="text-center font-semibold">Score</div>
              <div className="text-center font-semibold">Date</div>
              <div className="text-center font-semibold">Attempt</div>
              <div className="text-center font-semibold">Time</div>
            </div>

            {loading ? (
              <div className="divide-y divide-white/10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_60px] gap-3 px-6 py-5 items-center">
                    <div className="h-5 w-32 rounded-md bg-white/5 animate-pulse" />
                    <div className="h-5 w-10 rounded-md bg-white/5 animate-pulse mx-auto" />
                    <div className="h-5 w-16 rounded-md bg-white/5 animate-pulse mx-auto" />
                    <div className="h-5 w-10 rounded-md bg-white/5 animate-pulse mx-auto" />
                    <div className="h-5 w-8 rounded-md bg-white/5 animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="px-5 py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-white font-medium mb-1">No results yet</h3>
                <p className="text-sm text-zinc-500 text-center">Take a test to see your scores here.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {results.map((r) => (
                  <Link 
                    href={`/results/${r.attempt_id}?testId=${r.test_id}&view=analysis`} 
                    key={r.attempt_id} 
                    className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_60px] gap-3 px-6 py-5 text-xs items-center hover:bg-white/[0.04] transition-colors group cursor-pointer"
                  >
                    <div className="truncate text-white text-left font-medium group-hover:text-red-400 transition-colors">{r.test_title}</div>
                    <div className="text-white font-medium text-center">{r.score ?? "—"}<span className="text-zinc-500">/{r.max_score ?? r.total_marks}</span></div>
                    <div className="text-zinc-400 text-center">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}</div>
                    <div className="text-center flex justify-center">
                      {r.attempt_no === 1 ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 font-medium tracking-wide text-[10px]">1st</span>
                      ) : (
                        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-orange-300 font-medium tracking-wide text-[10px]">Re #{r.attempt_no}</span>
                      )}
                    </div>
                    <div className="text-zinc-400 text-center font-mono">{r.time_taken_sec ? `${Math.floor(r.time_taken_sec / 60)}m` : "—"}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-zinc-500">Page {page + 1} of {totalPages}</div>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-30">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-30">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Challenges */}
      <div>
        <SectionTitle title="Challenges" subtitle="Questions challenged & status" />
        
        <Panel className="mt-6 overflow-hidden p-0">
          <div className="grid grid-cols-[1fr_80px_100px] gap-3 border-b border-white/10 px-6 py-5 text-[10px] uppercase tracking-[0.2em] text-zinc-500 bg-white/[0.02]">
            <div className="text-left font-semibold">Review Request</div>
            <div className="text-center font-semibold">Status</div>
            <div className="text-right font-semibold">Date</div>
          </div>

          {loadingChallenges ? (
            <div className="divide-y divide-white/10">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px] gap-3 px-6 py-5 items-center">
                  <div className="h-5 w-3/4 rounded-md bg-white/5 animate-pulse" />
                  <div className="h-5 w-16 rounded-md bg-white/5 animate-pulse mx-auto" />
                  <div className="h-5 w-16 rounded-md bg-white/5 animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <div className="px-5 py-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="text-white font-medium mb-1">No challenges</h3>
              <p className="text-sm text-zinc-500 text-center">You haven't challenged any questions yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
              {challenges.map((c) => (
                <div key={c.id} className="flex flex-col gap-2 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="grid grid-cols-[1fr_80px_100px] gap-3 text-xs items-center">
                    <div className="text-white font-medium truncate" title={c.reason || "Review"}>
                      {c.question?.content_json?.[0]?.data?.text || c.note?.title || c.reason || "Review Request"}
                    </div>
                    <div className="flex justify-center">
                      {c.status === "PENDING" && <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-yellow-300 text-[10px]">Pending</span>}
                      {c.status === "RESOLVED" && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px]">Resolved</span>}
                      {c.status === "REJECTED" && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-red-300 text-[10px]">Rejected</span>}
                      {c.status === "ESCALATED" && <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-purple-300 text-[10px]">Escalated</span>}
                    </div>
                    <div className="text-zinc-400 text-right">
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-3 justify-start mt-1">
                    <button onClick={() => setViewChallenge(c)} className="text-[10px] uppercase tracking-wider text-blue-400 hover:text-blue-300 font-medium">View Details</button>
                    {c.status === "PENDING" && (
                      <button 
                        onClick={() => handleWithdraw(c.id)} 
                        disabled={withdrawingId === c.id}
                        className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
                      >
                        {withdrawingId === c.id ? "Withdrawing..." : "Withdraw"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {viewChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl relative my-auto">
            <button onClick={() => setViewChallenge(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition text-xl leading-none">&times;</button>
            <h3 className="text-xl font-bold text-white mb-2">Challenge Details</h3>
            
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-zinc-500 mb-6 pb-6 border-b border-white/10">
              <div>Status: <span className="text-white">{viewChallenge.status}</span></div>
              <div>Date: <span className="text-white">{new Date(viewChallenge.created_at).toLocaleDateString()}</span></div>
              {viewChallenge.question && <div>Question ID: <span className="text-white font-mono">{viewChallenge.question.id}</span></div>}
              {viewChallenge.note && <div>Note ID: <span className="text-white font-mono">{viewChallenge.note.id}</span></div>}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Your Challenge Reason</h4>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-200">
                  <span className="font-semibold">{viewChallenge.reason}</span>: {viewChallenge.description}
                </div>
              </div>

              {viewChallenge.resolution_note && (
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-emerald-500 mb-2">Resolution Note</h4>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-200">
                    {viewChallenge.resolution_note}
                  </div>
                </div>
              )}

              {viewChallenge.question && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">Question Content</h4>
                  <div className="text-base text-zinc-200 mb-6">
                    <ContentBlockRenderer blocks={viewChallenge.question.content_json || []} />
                  </div>

                  <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">Options</h4>
                  <div className="space-y-2 mb-6">
                    {(() => {
                      const q = viewChallenge.question;
                      if (!q.options_json?.options) return <div className="text-sm text-zinc-400">Options not available.</div>;
                      
                      return q.options_json.options.map((opt: any) => {
                        let isCorrect = false;
                        if (Array.isArray(q.answer_key?.correct_options)) {
                          isCorrect = q.answer_key.correct_options.includes(opt.id);
                        } else {
                          isCorrect = q.answer_key?.correct_option === opt.id;
                        }
                        return (
                          <div key={opt.id} className={`p-3 rounded-lg border ${isCorrect ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-zinc-300'}`}>
                            {opt.text}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {viewChallenge.question.solution_json && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">Solution</h4>
                      <div className="text-sm text-zinc-300 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                        {typeof viewChallenge.question.solution_json === 'string' ? viewChallenge.question.solution_json : <ContentBlockRenderer blocks={Array.isArray(viewChallenge.question.solution_json) ? viewChallenge.question.solution_json : []} />}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewChallenge.note && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">Note Content</h4>
                  <div className="text-base text-zinc-200 mb-6">
                    <div className="font-bold mb-4 text-white text-lg">{viewChallenge.note.title}</div>
                    <div className="prose max-w-none prose-invert text-zinc-300" dangerouslySetInnerHTML={{ __html: viewChallenge.note.content_html }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={() => setViewChallenge(null)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
