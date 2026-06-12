"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";
import adminService, { type AdminQuestion } from "@/services/admin.service";
import { HierarchyService } from "@/services/hierarchy.service";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import UserHoverCard from "@/components/ui/UserHoverCard";

const QUESTION_TYPES = [
  "ALL",
  "SINGLE_CORRECT",
  "MULTIPLE_CORRECT",
  "TRUE_FALSE",
  "FILL_BLANK",
  "MATCHING",
  "PASSAGE",
  "NUMERICAL",
  "ESSAY",
  "IMAGE_BASED",
];

const DIFFICULTIES = ["ALL", "EASY", "MEDIUM", "HARD"];
const PAGE_SIZE = 15;

const typeLabel = (t: string) =>
  t
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const difficultyBadge = (d: string) => {
  const colors: Record<string, string> = {
    EASY: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    MEDIUM: "border-red-500/20 bg-red-500/10 text-red-300",
    HARD: "border-red-500/20 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${colors[d] || "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"}`}
    >
      {d}
    </span>
  );
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [diffFilter, setDiffFilter] = useState("ALL");
  const [pyqFilter, setPyqFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("");

  // Hierarchy Filters
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");

  // Hierarchy Data Processing
  useEffect(() => {
    HierarchyService.getFullHierarchy()
      .then(setHierarchy)
      .catch(err => console.error("Failed to load hierarchy", err));
  }, []);

  const allCourses = hierarchy;
  const allSections = hierarchy.flatMap(c => c.sections || []);
  const allChapters = allSections.flatMap((s: any) => s.chapters || []);
  const allTopics = allChapters.flatMap((c: any) => c.topics || []);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Expand for content preview
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getQuestions({
        search: search || undefined,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        difficulty: diffFilter !== "ALL" ? diffFilter : undefined,
        course_id: courseId || undefined,
        section_id: sectionId || undefined,
        chapter_id: chapterId || undefined,
        topic_id: topicId || undefined,
        is_pyq: pyqFilter === "YES" ? true : pyqFilter === "NO" ? false : undefined,
        exam_year: yearFilter || undefined,
        page: page + 1,
        limit: PAGE_SIZE,
      });
      setQuestions(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, diffFilter, courseId, sectionId, chapterId, topicId, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await adminService.deleteQuestion(id);
      setDeletingId(null);
      fetchQuestions();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete question");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <SectionTitle
        title="Questions"
        subtitle={`${total} question${total !== 1 ? "s" : ""} in the bank.`}
      />

      {/* Hierarchy Filters */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={courseId}
          onChange={e => {
            setCourseId(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30"
        >
          <option value="">All Courses</option>
          {allCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={sectionId}
          onChange={e => {
            setSectionId(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30"
        >
          <option value="">All Sections</option>
          {allSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={chapterId}
          onChange={e => {
            setChapterId(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30"
        >
          <option value="">All Chapters</option>
          {allChapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={topicId}
          onChange={e => {
            setTopicId(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30"
        >
          <option value="">All Topics</option>
          {allTopics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Basic Filters bar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
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
            placeholder="Search by title or ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30 appearance-none cursor-pointer"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t} className="bg-zinc-900 text-white">
              {t === "ALL" ? "All Types" : typeLabel(t)}
            </option>
          ))}
        </select>

        {/* Difficulty filter */}
        <select
          value={diffFilter}
          onChange={(e) => {
            setDiffFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30 appearance-none cursor-pointer"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d} className="bg-zinc-900 text-white">
              {d === "ALL" ? "All Difficulties" : d}
            </option>
          ))}
        </select>

        {/* PYQ filter */}
        <select
          value={pyqFilter}
          onChange={(e) => {
            setPyqFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30 appearance-none cursor-pointer"
        >
          <option value="ALL" className="bg-zinc-900 text-white">All PYQ Status</option>
          <option value="YES" className="bg-zinc-900 text-white">Only PYQs</option>
          <option value="NO" className="bg-zinc-900 text-white">Non-PYQs</option>
        </select>

        {/* Year filter */}
        <div className="relative flex-1 sm:max-w-[120px]">
          <input
            type="text"
            placeholder="Year (e.g. 2023)"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Questions list */}
      <Panel className="mt-4 p-0 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[280px_minmax(0,2fr)_minmax(0,1fr)_80px_minmax(150px,2fr)_120px_140px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <div>ID</div>
            <div>Title</div>
            <div>Type</div>
            <div>Difficulty</div>
            <div>Tags</div>
            <div>Author</div>
            <div>Actions</div>
          </div>

          {loading ? (
            <div className="divide-y divide-white/10">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[280px_minmax(0,2fr)_minmax(0,1fr)_80px_minmax(150px,2fr)_120px_140px] gap-3 px-5 py-4"
                >
                  <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-14 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-500">
              No questions found{search ? ` matching "${search}"` : ""}.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {questions.map((q) => {
                const contentBlocks = Array.isArray((q as any).content_json)
                  ? (q as any).content_json
                  : [];

                return (
                  <div key={q.id}>
                    <div className="grid grid-cols-[280px_minmax(0,2fr)_minmax(0,1fr)_80px_minmax(150px,2fr)_120px_140px] gap-3 px-5 py-4 text-sm items-center">
                      <div className="font-mono text-[10px] text-zinc-500 truncate" title={q.id}>
                        {q.id}
                      </div>

                      <button
                        onClick={() =>
                          setExpandedId(expandedId === q.id ? null : q.id)
                        }
                        className="truncate text-white text-left hover:text-red-300 transition cursor-pointer"
                      >
                        <div 
                          className="text-sm font-medium text-white truncate max-w-[200px]"
                          title={q.content_json?.[0]?.content?.substring(0, 100) || "Question Content"}
                        >
                          {q.content_json?.[0]?.content?.substring(0, 40) || "Question Content"}
                        </div>
                      </button>

                      <div className="text-xs text-zinc-400">
                        {typeLabel(q.question_type)}
                      </div>

                      <div>{difficultyBadge(q.difficulty)}</div>



                      <div className="truncate text-[10px] text-zinc-500 leading-tight">
                        {q.topic?.chapter?.section?.name && (
                          <span className="text-zinc-400">{q.topic.chapter.section.name} &gt; </span>
                        )}
                        {q.topic?.chapter?.name && (
                          <span className="text-zinc-400">{q.topic.chapter.name} &gt; </span>
                        )}
                        <span className="text-zinc-300 font-medium">{q.topic?.name || "—"}</span>
                      </div>

                      <div className="text-xs text-zinc-400 truncate">
                        {q.creator || q.created_by ? (
                          <UserHoverCard userId={q.created_by}>
                            {q.creator ? `${q.creator.first_name || ""} ${q.creator.last_name || ""}`.trim() || "Admin" : q.created_by}
                          </UserHoverCard>
                        ) : (
                          "Admin"
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {deletingId === q.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(q.id)}
                              disabled={deleteLoading}
                              className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteLoading ? "…" : "Yes"}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 transition hover:text-white"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/admin/questions/${q.id}/edit`}
                              className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-300 transition hover:bg-purple-500/20"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => setDeletingId(q.id)}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded content preview with LaTeX rendering */}
                    {expandedId === q.id && contentBlocks.length > 0 && (
                      <div className="border-t border-white/5 bg-white/[0.02] px-5 py-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                          Content Preview
                        </div>
                        <ContentBlockRenderer blocks={contentBlocks} />
                        {q.topic?.chapter && (
                          <div className="mt-3 text-xs text-zinc-500">
                            {q.topic.chapter.section?.course?.name ?? "Course"} → {q.topic.chapter.name} → {q.topic.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Panel>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Page {page + 1} of {totalPages} · {total} questions
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
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
