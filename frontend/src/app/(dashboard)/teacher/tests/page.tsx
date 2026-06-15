"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus } from "lucide-react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { TestsService } from "@/services/tests.service";
import { HierarchyService } from "@/services/hierarchy.service";
import { AdminTestSeriesService } from "@/services/test-series.admin.service";
import authService from "@/services/auth.service";

export default function TeacherTestsPage() {
  const queryClient = useQueryClient();

  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const [createdOnly, setCreatedOnly] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [testSeriesList, setTestSeriesList] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [testSeriesId, setTestSeriesId] = useState("");

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

    AdminTestSeriesService.getAdminTestSeries()
      .then(res => setTestSeriesList(res || []))
      .catch(err => console.error("Failed to load test series", err));
  }, []);

  const allCourses = hierarchy;
  const allSections = hierarchy.flatMap(c => c.sections || []);
  const allChapters = allSections.flatMap((s: any) => s.chapters || []);
  const allTopics = allChapters.flatMap((c: any) => c.topics || []);

  const { data: testsData, isLoading: loading, isFetching, error: queryError } = useQuery({
    queryKey: ["tests", "teacherList", createdOnly, courseId, sectionId, chapterId, topicId, debouncedSearch],
    queryFn: async () => {
      const filters: any = {};
      if (createdOnly) filters.created_only = true;
      if (courseId) filters.course_id = courseId;
      if (sectionId) filters.section_id = sectionId;
      if (chapterId) filters.chapter_id = chapterId;
      if (topicId) filters.topic_id = topicId;
      if (testSeriesId) filters.testSeriesId = testSeriesId;
      if (debouncedSearch) filters.search = debouncedSearch;
      
      return await TestsService.getTeacherTests(filters);
    },
    staleTime: 0,
  });

  const tests: any[] = testsData?.data || [];
  const total = testsData?.total || 0;
  const error = queryError ? (queryError as any)?.response?.data?.message || "Failed to load tests" : null;

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUserRole(user.role || "");
      setUserId(user.id || "");
    }
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["tests", "teacherList"] });
  };

  const canEdit = (test: any) => {
    if (userRole === "ADMIN") return true;
    return test.created_by === userId;
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test? This action cannot be undone.")) return;
    try {
      await TestsService.deleteTest(testId);
      handleRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete test");
    }
  };

  return (
    <>
      <SectionTitle
        title="Tests"
        subtitle="Create, schedule, and manage test sets from the knight panel."
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
            <Link
              href="/teacher/tests/create"
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 transition hover:bg-red-500"
            >
              <Plus size={16} />
              Create Test
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Hierarchy Filters */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={testSeriesId}
          onChange={e => {
            setTestSeriesId(e.target.value);
            if (e.target.value) {
              setCourseId(""); setSectionId(""); setChapterId(""); setTopicId("");
            }
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30"
        >
          <option value="">All Test Series</option>
          {testSeriesList.map((ts: any) => <option key={ts.id} value={ts.id}>{ts.name}</option>)}
        </select>

        <select
          value={courseId}
          onChange={e => {
            setCourseId(e.target.value);
            if (e.target.value) setTestSeriesId("");
          }}
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

      <div className="mt-4 relative max-w-md">
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
          placeholder="Search tests by title..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500 lg:col-span-3">
            Loading tests...
          </div>
        ) : tests.length === 0 ? (
          <Panel className="py-12 text-center text-sm text-zinc-500 lg:col-span-3">
            No tests found. Create a new test to get started!
          </Panel>
        ) : (
          tests.map((test) => (
            <Panel key={test.id} accent={test.status === "PUBLISHED" || test.status === "ONGOING"} className="p-5">
              <div className="flex justify-between items-start">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 break-all" title={test.id}>
                  {test.id}
                </div>
                <div className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                  {test.creator ? (test.creator.first_name || "King") : "King"}
                </div>
              </div>
              
              <h3 className="mt-2 text-lg font-semibold text-white line-clamp-2" title={test.title}>
                {test.title}
              </h3>

              <div className="mt-4 space-y-2 text-sm text-zinc-400">
                <div className="flex items-center justify-between gap-4">
                  <span>Topic</span>
                  <span className="text-zinc-200 truncate max-w-[150px]" title={test.topic?.name}>{test.topic?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Schedule</span>
                  <span className="text-zinc-200">
                    {test.start_time ? new Date(test.start_time).toLocaleDateString() : "Anytime"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Questions</span>
                  <span className="text-zinc-200">{test._count?.test_questions || 0}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Duration</span>
                  <span className="text-zinc-200">{test.duration_minutes}m</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Status</span>
                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-[10px] font-medium uppercase",
                      test.status === "PUBLISHED" || test.status === "ONGOING"
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : test.status === "COMPLETED"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
                    ].join(" ")}
                  >
                    {test.status}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/tests/${test.id}`} className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
                  Preview
                </Link>
                {canEdit(test) && (
                  <>
                    <Link href={`/teacher/tests/${test.id}/edit`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                      Edit
                    </Link>
                    <button onClick={() => handleDeleteTest(test.id)} className="rounded-full border border-red-500/30 bg-white/[0.03] px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </Panel>
          ))
        )}
      </div>
    </>
  );
}
