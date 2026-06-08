"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import SectionTitle from "@/components/ui/SectionTitle";
import TestCard from "@/components/tests/TestCard";
import studentService, { type TestListItem } from "@/services/student.service";

export default function TestsPage() {
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentService.getTests({
        search: search || undefined,
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      });
      setTests(res.data);
      setTotal(res.total);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load tests");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.12),_transparent_30%),linear-gradient(to_bottom,_#000,_#090909_50%,_#000)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionTitle
          title="Available Tests"
          subtitle={`${total} test${total !== 1 ? "s" : ""} available. Pick one to start a timed attempt.`}
        />

        {/* Search */}
        <div className="mt-6 relative max-w-md">
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search tests…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Tests grid */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
                />
              ))
            : tests.map((test) => (
                <TestCard
                  key={test.id}
                  test={{
                    id: test.id,
                    title: test.title,
                    subject: test.description || "General",
                    durationMinutes: test.duration_minutes,
                    questions: test._count.test_questions,
                    status:
                      test.status === "PUBLISHED"
                        ? "live"
                        : test.status === "COMPLETED"
                          ? "completed"
                          : "upcoming",
                  }}
                />
              ))}
        </div>

        {!loading && tests.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-zinc-500">
              {search
                ? `No tests found matching "${search}"`
                : "No tests available yet. Check back soon!"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-zinc-500">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
