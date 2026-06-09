"use client";

import { useEffect, useState, use } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import Link from "next/link";
import { ChevronDown, ChevronRight, FileText, BookOpen } from "lucide-react";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = use(params);
  const { courseId } = unwrappedParams;
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    HierarchyService.getFullHierarchy()
      .then((data) => {
        const c = data.find((c: any) => c.id === courseId);
        if (c) setCourse(c);
        else setError("Course not found.");
      })
      .catch(() => setError("Failed to load course details."))
      .finally(() => setLoading(false));
  }, [courseId]);

  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleChapter = (id: string) => setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <DashboardShell activeHref="/courses">
      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-1/3 bg-white/10 rounded" />
          <div className="h-6 w-1/4 bg-white/5 rounded" />
          <div className="h-40 bg-white/5 rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-red-400">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Link href="/courses" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 mb-4">
              <ChevronLeft size={16} /> Back to Courses
            </Link>
            <SectionTitle title={course.name} subtitle={`Course Code: ${course.code}`} />
          </div>

          <div className="space-y-4 max-w-4xl">
            {course.sections?.map((section: any) => (
              <Panel key={section.id} className="p-0 overflow-hidden border border-white/10">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white">Section: {section.name}</h3>
                  {expandedSections[section.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>

                {expandedSections[section.id] && (
                  <div className="border-t border-white/5 bg-black/40">
                    {section.chapters?.length === 0 ? (
                      <p className="p-4 text-sm text-zinc-500">No chapters in this section.</p>
                    ) : (
                      section.chapters?.map((chapter: any) => (
                        <div key={chapter.id} className="border-b border-white/5 last:border-0">
                          <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="w-full flex items-center justify-between p-4 pl-8 hover:bg-white/[0.02] transition-colors"
                          >
                            <h4 className="text-md font-medium text-zinc-300">Chapter: {chapter.name}</h4>
                            {expandedChapters[chapter.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>

                          {expandedChapters[chapter.id] && (
                            <div className="bg-black/60 p-4 pl-12 space-y-2">
                              {chapter.topics?.length === 0 ? (
                                <p className="text-sm text-zinc-500">No topics in this chapter.</p>
                              ) : (
                                chapter.topics?.map((topic: any) => (
                                  <Link
                                    key={topic.id}
                                    href={`/topics/${topic.id}`}
                                    className="block p-3 rounded-lg border border-white/5 bg-zinc-900/50 hover:bg-zinc-800 hover:border-red-500/30 transition-all group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-zinc-300 group-hover:text-white font-medium">{topic.name}</span>
                                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1 group-hover:text-red-400">
                                          <BookOpen size={14} /> View Notes & Tests
                                        </span>
                                      </div>
                                    </div>
                                  </Link>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Panel>
            ))}
            
            {course.sections?.length === 0 && (
              <Panel>
                <p className="text-zinc-500">Curriculum is empty for this course.</p>
              </Panel>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

// Ensure ChevronLeft is available
import { ChevronLeft } from "lucide-react";
