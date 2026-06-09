"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
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
      .getResults({ skip: page * PAGE_SIZE, take: PAGE_SIZE })
      .then((res) => { setResults(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <DashboardShell activeHref="/results">
        <SectionTitle title="Results" subtitle={`${total} attempt${total !== 1 ? "s" : ""} recorded.`} />

        <Panel className="mt-6 overflow-x-auto p-0">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_80px_100px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
              <div>Test</div><div>Score</div><div>Date</div><div>Attempt</div><div>Time</div><div>Action</div>
            </div>

            {loading ? (
              <div className="divide-y divide-white/10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_80px_100px] gap-3 px-5 py-4">
                    <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-12 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-8 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-10 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-14 animate-pulse rounded bg-white/10" />
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-zinc-500">No results yet. Take a test to see your scores here.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {results.map((r) => (
                  <div key={r.attempt_id} className="grid grid-cols-[minmax(0,2fr)_80px_100px_80px_80px_100px] gap-3 px-5 py-4 text-sm items-center">
                    <div className="truncate text-white">{r.test_title}</div>
                    <div className="text-white font-medium">{r.score ?? "—"}<span className="text-zinc-500">/{r.total_marks}</span></div>
                    <div className="text-xs text-zinc-500">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}</div>
                    <div className="text-xs">
                      {r.attempt_no === 1 ? (
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-red-300">1st</span>
                      ) : (
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-red-300">Re #{r.attempt_no}</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">{r.time_taken_sec ? `${Math.floor(r.time_taken_sec / 60)}m` : "—"}</div>
                    <Link href={`/results/${r.attempt_id}?testId=${r.test_id}`}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20 text-center">
                      View
                    </Link>
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
    </DashboardShell>
  );
}
