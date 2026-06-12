"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { QuestionsService } from "@/services/questions.service";
import { HierarchyService } from "@/services/hierarchy.service";
import authService from "@/services/auth.service";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";

const QUESTION_TYPES = [
  "ALL", "SINGLE_CORRECT", "MULTIPLE_CORRECT", "NUMERICAL", "TRUE_FALSE", "MATCHING", "PASSAGE", "ESSAY", "FILL_BLANK", "IMAGE_BASED", "DRAG_DROP", "CODE", "ASSERTION_REASON"
];
const DIFFICULTIES = ["ALL", "EASY", "MEDIUM", "HARD"];
const typeLabel = (t: string) => t.replace(/_/g, " ");

export default function TeacherQuestionsPage() {
  const queryClient = useQueryClient();

  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const [createdOnly, setCreatedOnly] = useState(false);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [diffFilter, setDiffFilter] = useState("ALL");
  const [pyqFilter, setPyqFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Submitting state
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Hierarchy Filters
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchFilter);
    }, 400);
    return () => clearTimeout(t);
  }, [searchFilter]);

  useEffect(() => {
    HierarchyService.getFullHierarchy()
      .then(setHierarchy)
      .catch(err => console.error("Failed to load hierarchy", err));
  }, []);

  const allCourses = hierarchy;
  const allSections = hierarchy.flatMap(c => c.sections || []);
  const allChapters = allSections.flatMap((s: any) => s.chapters || []);
  const allTopics = allChapters.flatMap((c: any) => c.topics || []);

  const { data: questionsData, isLoading: loading, isFetching, error: queryError } = useQuery({
    queryKey: ["questions", "list", createdOnly, courseId, sectionId, chapterId, topicId, typeFilter, diffFilter, pyqFilter, yearFilter, debouncedSearch],
    queryFn: async () => {
      const filters: any = {};
      if (createdOnly) filters.created_by_me = true;
      if (courseId) filters.course_id = courseId;
      if (sectionId) filters.section_id = sectionId;
      if (chapterId) filters.chapter_id = chapterId;
      if (topicId) filters.topic_id = topicId;
      if (typeFilter !== "ALL") filters.type = typeFilter;
      if (diffFilter !== "ALL") filters.difficulty = diffFilter;
      if (debouncedSearch) filters.search = debouncedSearch;
      if (pyqFilter !== "ALL") filters.is_pyq = pyqFilter === "YES";
      if (yearFilter) filters.exam_year = yearFilter;
      
      return await QuestionsService.getAll(filters);
    },
    staleTime: 0,
  });

  const questions: any[] = questionsData?.data || [];
  const total = questionsData?.total || 0;
  const error = queryError ? (queryError as any)?.response?.data?.message || "Failed to load questions" : null;

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUserRole(user.role || "");
      setUserId(user.id || "");
    }
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["questions", "list"] });
  };

  const handleSubmitReview = async (id: string) => {
    setSubmittingId(id);
    try {
      await QuestionsService.submitForReview(id);
      queryClient.invalidateQueries({ queryKey: ["questions", "list"] }); // Refresh
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to submit for review");
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
      case "PENDING_REVIEW": return "border-red-500/20 bg-red-500/10 text-red-300";
      case "REJECTED": return "border-red-500/20 bg-red-500/10 text-red-300";
      case "NEEDS_REVISION": return "border-rose-500/20 bg-rose-500/10 text-rose-300";
      default: return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"; // DRAFT
    }
  };

  // Determine if current user can edit a question
  const canEdit = (q: any) => {
    if (userRole === "ADMIN") return true;
    if (userRole === "TEACHER") return q.created_by === userId;
    if (userRole === "INTERN") return q.created_by === userId;
    return false;
  };

  // Determine if current user can see action buttons at all
  const canSeeActions = (q: any) => {
    if (userRole === "ADMIN") return true;
    if (userRole === "TEACHER") return q.created_by === userId;
    if (userRole === "INTERN") return q.created_by === userId;
    return false;
  };

  return (
    <>
      <SectionTitle
        title="Question Bank"
        subtitle={`${total} question${total !== 1 ? "s" : ""} in your workspace.`}
        action={
          <div className="flex items-center gap-4">
            {userRole === "TEACHER" && (
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={createdOnly}
                  onChange={(e) => setCreatedOnly(e.target.checked)}
                  className="rounded border-zinc-700 bg-black/50 text-red-500 focus:ring-red-500/50"
                />
                Created by me
              </label>
            )}
            <button 
              onClick={handleRefresh}
              disabled={isFetching}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:text-white hover:bg-white/[0.06] disabled:opacity-50 flex items-center gap-2"
            >
              {isFetching ? "Refreshing..." : "Refresh"}
            </button>
            {(userRole === "TEACHER" || userRole === "ADMIN") && (
              <Link href="/teacher/questions/review"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:text-white">
                Review Approvals
              </Link>
            )}
            {(userRole === "TEACHER" || userRole === "ADMIN" || userRole === "INTERN") && (
              <Link href="/teacher/questions/create"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20">
                + Create Question
              </Link>
            )}
          </div>
        }
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Hierarchy Filters */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30"
        >
          <option value="">All Courses</option>
          {allCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={sectionId}
          onChange={e => setSectionId(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30"
        >
          <option value="">All Sections</option>
          {allSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={chapterId}
          onChange={e => setChapterId(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30"
        >
          <option value="">All Chapters</option>
          {allChapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={topicId}
          onChange={e => setTopicId(e.target.value)}
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
            placeholder="Search by ID or keywords..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
          onChange={(e) => setDiffFilter(e.target.value)}
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
          onChange={(e) => setPyqFilter(e.target.value)}
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
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30"
          />
        </div>
      </div>

      <Panel className="mt-4 p-0 overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[140px_minmax(200px,2fr)_140px_100px_minmax(150px,2fr)_120px_140px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500 text-left">
            <div>ID</div>
            <div>Title</div>
            <div>Type</div>
            <div>Difficulty</div>
            <div>Tags</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {loading ? (
            <div className="divide-y divide-white/10">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[140px_minmax(200px,2fr)_140px_100px_minmax(150px,2fr)_120px_140px] gap-3 px-5 py-4"
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
              No questions found. Start by creating one!
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {questions.map((q) => {
                const contentBlocks = Array.isArray((q as any).content_json)
                  ? (q as any).content_json
                  : [];

                return (
                  <div key={q.id}>
                    <div className={`grid grid-cols-[140px_minmax(200px,2fr)_140px_100px_minmax(150px,2fr)_120px_140px] gap-3 px-5 py-4 text-sm items-center text-left ${q.approval_status === "DRAFT" || q.approval_status === "NEEDS_REVISION" ? "bg-white/[0.02]" : ""}`}>
                      <div className="font-mono text-[10px] text-zinc-500 truncate" title={q.id}>
                        {q.id}
                      </div>

                      <button
                        onClick={() =>
                          setExpandedId(expandedId === q.id ? null : q.id)
                        }
                        className="truncate text-white hover:text-red-300 transition cursor-pointer text-left"
                      >
                        <div 
                          className="text-sm font-medium text-white truncate w-full"
                          title={q.content_json?.[0]?.content?.substring(0, 100) || "Question Content"}
                        >
                          {q.content_json?.[0]?.content?.substring(0, 40) || "Question Content"}
                        </div>
                      </button>

                      <div className="text-xs text-zinc-400">
                        {typeLabel(q.question_type)}
                      </div>

                      <div>
                        <span className="text-xs text-zinc-400">
                          {q.difficulty}
                        </span>
                      </div>

                      <div className="truncate text-[10px] text-zinc-500 leading-tight">
                        {q.topic?.chapter?.section?.name && (
                          <span className="text-zinc-400">{q.topic.chapter.section.name} &gt; </span>
                        )}
                        {q.topic?.chapter?.name && (
                          <span className="text-zinc-400">{q.topic.chapter.name} &gt; </span>
                        )}
                        <span className="text-zinc-300 font-medium">{q.topic?.name || "—"}</span>
                      </div>

                      <div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${getStatusColor(q.approval_status)}`}>
                          {q.approval_status.replace(/_/g, " ")}
                        </span>
                        {q.approval_status === "NEEDS_REVISION" && q.rejection_note && (
                          <div className="text-[10px] text-red-400 mt-1 truncate" title={q.rejection_note}>
                            {q.rejection_note}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center flex-wrap items-center gap-1">
                        {canSeeActions(q) && (
                          <>
                            {canEdit(q) && (
                              <Link href={`/teacher/questions/${q.id}/edit`}
                                className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-zinc-300 transition hover:bg-white/[0.06]">
                                Edit
                              </Link>
                            )}
                            {userRole === "INTERN" && q.created_by === userId && (q.approval_status === "DRAFT" || q.approval_status === "NEEDS_REVISION") && (
                              <button onClick={() => handleSubmitReview(q.id)} disabled={submittingId === q.id}
                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50">
                                {submittingId === q.id ? "Submitting…" : "Submit"}
                              </button>
                            )}
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
    </>
  );
}
