"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { HierarchyService } from "@/services/hierarchy.service";

export default function HierarchyManagerPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Forms state
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({ name: "", code: "" });

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({ name: "", order: 1 });

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [chapterForm, setChapterForm] = useState({ name: "", order: 1 });

  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState({ name: "", order: 1 });

  const fetchHierarchy = async () => {
    try {
      const data = await HierarchyService.getFullHierarchy();
      setHierarchy(data);
    } catch (err: any) {
      setError("Failed to fetch hierarchy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    await HierarchyService.createCourse(courseForm);
    setCourseForm({ name: "", code: "" });
    setShowCourseForm(false);
    fetchHierarchy();
  };

  const handleCreateSection = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    await HierarchyService.createSection({ ...sectionForm, course_id: courseId });
    setSectionForm({ name: "", order: 1 });
    setActiveCourseId(null);
    fetchHierarchy();
  };

  const handleCreateChapter = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    await HierarchyService.createChapter({ ...chapterForm, section_id: sectionId });
    setChapterForm({ name: "", order: 1 });
    setActiveSectionId(null);
    fetchHierarchy();
  };

  const handleCreateTopic = async (e: React.FormEvent, chapterId: string) => {
    e.preventDefault();
    await HierarchyService.createTopic({ ...topicForm, chapter_id: chapterId });
    setTopicForm({ name: "", order: 1 });
    setActiveChapterId(null);
    fetchHierarchy();
  };

  const navItems = [
    { label: "Teacher home", href: "/teacher" },
    { label: "Hierarchy", href: "/teacher/hierarchy" },
    { label: "Questions", href: "/teacher/questions" },
    { label: "Tests", href: "/teacher/tests" },
  ];

  return (
    <DashboardShell activeHref="/teacher/hierarchy">
      <div className="flex items-center justify-between">
        <SectionTitle title="Academic Hierarchy" subtitle="Manage Courses, Sections, Chapters, and Topics" />
        <button
          onClick={() => setShowCourseForm(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          + Create Course
        </button>
      </div>

      {error && <div className="mt-4 text-red-500">{error}</div>}

      {showCourseForm && (
        <Panel className="mt-6 mb-6">
          <form onSubmit={handleCreateCourse} className="flex gap-4 items-end">
            <div>
              <label className="text-xs text-zinc-400">Course Name</label>
              <input type="text" required value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-500" placeholder="e.g. Physics 101" />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Course Code</label>
              <input type="text" required value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-500" placeholder="PHY101" />
            </div>
            <button type="submit" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black">Save</button>
            <button type="button" onClick={() => setShowCourseForm(false)} className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white">Cancel</button>
          </form>
        </Panel>
      )}

      {loading ? (
        <p className="mt-6 text-zinc-500">Loading hierarchy...</p>
      ) : (
        <div className="mt-8 space-y-6">
          {hierarchy.length === 0 ? (
            <p className="text-zinc-500">No courses found. Create one to get started.</p>
          ) : (
            hierarchy.map((course) => (
              <Panel key={course.id} className="space-y-4 border-l-4 border-l-red-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{course.name} <span className="text-zinc-500 text-sm ml-2">({course.code})</span></h3>
                  <button onClick={() => setActiveCourseId(course.id)} className="text-xs text-red-400 hover:text-white">+ Add Section</button>
                </div>

                {activeCourseId === course.id && (
                  <form onSubmit={(e) => handleCreateSection(e, course.id)} className="flex gap-4 items-end p-4 bg-black/40 rounded-lg">
                    <div>
                      <label className="text-xs text-zinc-400">Section Name</label>
                      <input type="text" required value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} className="mt-1 block w-full rounded border border-white/10 bg-black px-2 py-1 text-sm text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Order</label>
                      <input type="number" required value={sectionForm.order} onChange={e => setSectionForm({...sectionForm, order: Number(e.target.value)})} className="mt-1 block w-20 rounded border border-white/10 bg-black px-2 py-1 text-sm text-white" />
                    </div>
                    <button type="submit" className="rounded bg-zinc-700 px-3 py-1 text-sm text-white">Save</button>
                    <button type="button" onClick={() => setActiveCourseId(null)} className="rounded text-sm text-zinc-400">Cancel</button>
                  </form>
                )}

                <div className="space-y-4 pl-4 border-l border-white/10 ml-2 mt-4">
                  {course.sections?.map((section: any) => (
                    <div key={section.id} className="space-y-2">
                      <div className="flex items-center justify-between group">
                        <h4 className="text-md font-semibold text-zinc-200">Section: {section.name}</h4>
                        <button onClick={() => setActiveSectionId(section.id)} className="text-xs text-red-400 opacity-0 group-hover:opacity-100">+ Add Chapter</button>
                      </div>

                      {activeSectionId === section.id && (
                        <form onSubmit={(e) => handleCreateChapter(e, section.id)} className="flex gap-4 items-end p-3 bg-black/40 rounded-lg">
                          <div>
                            <input type="text" placeholder="Chapter Name" required value={chapterForm.name} onChange={e => setChapterForm({...chapterForm, name: e.target.value})} className="block w-full rounded border border-white/10 bg-black px-2 py-1 text-sm text-white" />
                          </div>
                          <div>
                            <input type="number" placeholder="Order" required value={chapterForm.order} onChange={e => setChapterForm({...chapterForm, order: Number(e.target.value)})} className="block w-20 rounded border border-white/10 bg-black px-2 py-1 text-sm text-white" />
                          </div>
                          <button type="submit" className="rounded bg-zinc-700 px-3 py-1 text-sm text-white">Save</button>
                          <button type="button" onClick={() => setActiveSectionId(null)} className="rounded text-sm text-zinc-400">Cancel</button>
                        </form>
                      )}

                      <div className="space-y-2 pl-4 border-l border-white/10 ml-2">
                        {section.chapters?.map((chapter: any) => (
                          <div key={chapter.id} className="space-y-1">
                            <div className="flex items-center justify-between group">
                              <h5 className="text-sm font-medium text-zinc-300">Chapter: {chapter.name}</h5>
                              <button onClick={() => setActiveChapterId(chapter.id)} className="text-xs text-red-400 opacity-0 group-hover:opacity-100">+ Add Topic</button>
                            </div>

                            {activeChapterId === chapter.id && (
                              <form onSubmit={(e) => handleCreateTopic(e, chapter.id)} className="flex gap-4 items-center p-2 bg-black/40 rounded-lg">
                                <input type="text" placeholder="Topic Name" required value={topicForm.name} onChange={e => setTopicForm({...topicForm, name: e.target.value})} className="block w-full rounded border border-white/10 bg-black px-2 py-1 text-xs text-white" />
                                <input type="number" placeholder="Order" required value={topicForm.order} onChange={e => setTopicForm({...topicForm, order: Number(e.target.value)})} className="block w-16 rounded border border-white/10 bg-black px-2 py-1 text-xs text-white" />
                                <button type="submit" className="rounded bg-zinc-700 px-2 py-1 text-xs text-white">Save</button>
                                <button type="button" onClick={() => setActiveChapterId(null)} className="rounded text-xs text-zinc-400">Cancel</button>
                              </form>
                            )}

                            <div className="flex flex-wrap gap-2 pl-4 ml-2 border-l border-white/5 py-1">
                              {chapter.topics?.map((topic: any) => (
                                <span key={topic.id} className="px-2 py-1 bg-zinc-900 rounded text-xs text-zinc-400 border border-white/5">
                                  {topic.name}
                                </span>
                              ))}
                              {chapter.topics?.length === 0 && <span className="text-xs text-zinc-600">No topics</span>}
                            </div>
                          </div>
                        ))}
                        {section.chapters?.length === 0 && <span className="text-xs text-zinc-600">No chapters</span>}
                      </div>
                    </div>
                  ))}
                  {course.sections?.length === 0 && <span className="text-xs text-zinc-600">No sections</span>}
                </div>
              </Panel>
            ))
          )}
        </div>
      )}
    </DashboardShell>
  );
}
