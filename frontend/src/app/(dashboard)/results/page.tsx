"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import studentService, { type ResultItem } from "@/services/student.service";

export default function ResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  useEffect(() => {
    studentService
      .getResults({ page: page + 1, limit: PAGE_SIZE })
      .then((res) => { setResults(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
        <SectionTitle title="Results" subtitle={`${total} attempt${total !== 1 ? "s" : ""} recorded.`} />

        <Panel className="mt-6 overflow-x-auto p-0">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_80px_100px] gap-3 border-b border-white/10 px-6 py-5 text-xs uppercase tracking-[0.2em] text-zinc-500 bg-white/[0.02]">
              <div className="text-left font-semibold">Test</div>
              <div className="text-center font-semibold">Score</div>
              <div className="text-center font-semibold">Date</div>
              <div className="text-center font-semibold">Attempt</div>
              <div className="text-center font-semibold">Time</div>
              <div className="text-center font-semibold">Action</div>
            </div>

            {loading ? (
              <div className="divide-y divide-white/10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_80px_100px] gap-3 px-6 py-5 items-center">
                    <div className="h-5 w-48 rounded-md bg-white/5 animate-pulse" />
                    <div className="h-5 w-12 rounded-md bg-white/5 animate-pulse mx-auto" />
                    <div className="h-5 w-20 rounded-md bg-white/5 animate-pulse mx-auto" />
                    <div className="h-5 w-12 rounded-md bg-white/5 animate-pulse mx-auto" />
                    <div className="h-5 w-10 rounded-md bg-white/5 animate-pulse mx-auto" />
                    <div className="h-8 w-16 rounded-md bg-white/5 animate-pulse mx-auto" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="px-5 py-16 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-white font-medium mb-1">No results yet</h3>
                <p className="text-sm text-zinc-500">Take a test to see your scores and analysis here.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {results.map((r) => (
                  <div key={r.attempt_id} className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_80px_100px] gap-3 px-6 py-5 text-sm items-center hover:bg-white/[0.02] transition-colors group">
                    <div className="truncate text-white text-left font-medium group-hover:text-red-400 transition-colors">{r.test_title}</div>
                    <div className="text-white font-medium text-center">{r.score ?? "—"}<span className="text-zinc-500">/{r.total_marks}</span></div>
                    <div className="text-xs text-zinc-400 text-center">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}</div>
                    <div className="text-xs text-center flex justify-center">
                      {r.attempt_no === 1 ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-emerald-300 font-medium tracking-wide">1st</span>
                      ) : (
                        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-orange-300 font-medium tracking-wide">Re #{r.attempt_no}</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400 text-center font-mono">{r.time_taken_sec ? `${Math.floor(r.time_taken_sec / 60)}m` : "—"}</div>
                    <div className="flex justify-center">
                      <Link href={`/results/${r.attempt_id}?testId=${r.test_id}&view=analysis`}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)] text-center w-full">
                        View
                      </Link>
                    </div>
                  </div>
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
    </>
  );
}
