"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import studentService, { type ResultItem } from "@/services/student.service";

export default function ResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [page, setPage] = useState(0);
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
                    <div className="text-white font-medium text-center">{r.score ?? "—"}<span className="text-zinc-500">/{r.total_marks}</span></div>
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
            <div className="text-left font-semibold">Question Challenge</div>
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
                <div key={c.id} className="grid grid-cols-[1fr_80px_100px] gap-3 px-6 py-5 text-xs items-center hover:bg-white/[0.02] transition-colors">
                  <div className="text-white font-medium truncate" title={c.reason || "Challenged"}>
                    {c.question?.content_json?.[0]?.data?.text || c.reason || "Question Challenge"}
                  </div>
                  <div className="flex justify-center">
                    {c.status === "PENDING" && <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-yellow-300 text-[10px]">Pending</span>}
                    {c.status === "RESOLVED" && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px]">Resolved</span>}
                    {c.status === "REJECTED" && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-red-300 text-[10px]">Rejected</span>}
                  </div>
                  <div className="text-zinc-400 text-right">
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
