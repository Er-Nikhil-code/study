"use client";

import { useEffect, useState, use } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import Link from "next/link";
import { ChevronDown, ChevronRight, BookOpen, ChevronLeft, Edit2, Plus, FileText, CheckCircle, BarChart2 } from "lucide-react";
import CourseLeaderboard from "@/components/ui/CourseLeaderboard";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = use(params);
  const { courseId } = unwrappedParams;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Forms for adding
  const [addingSection, setAddingSection] = useState(false);
  const [addingChapterTo, setAddingChapterTo] = useState<string | null>(null);
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);
  
  const [sectionForm, setSectionForm] = useState({ name: "", order: 1 });
  const [chapterForm, setChapterForm] = useState({ name: "", order: 1 });
  const [topicForm, setTopicForm] = useState({ name: "", description: "", order: 1 });

  // Forms for editing
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editSectionForm, setEditSectionForm] = useState({ name: "" });

  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editChapterForm, setEditChapterForm] = useState({ name: "" });

  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editTopicForm, setEditTopicForm] = useState({ name: "", description: "" });

  const fetchCourse = () => {
    setLoading(true);
    HierarchyService.getFullHierarchy()
      .then((data) => {
        const c = data.find((c: any) => c.id === courseId);
        if (c) {
          setCourse(c);
          // Auto-expand first section and chapter for better UX
          if (c.sections?.[0]) {
            setExpandedSections({ [c.sections[0].id]: true });
            if (c.sections[0].chapters?.[0]) {
              setExpandedChapters({ [c.sections[0].chapters[0].id]: true });
            }
          }
        } else {
          setError("Course not found.");
        }
      })
      .catch(() => setError("Failed to load course details."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleChapter = (id: string) => setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));

  const isCreatorOrAdmin = user?.role === "ADMIN" || (course && user?.id === course.created_by);
  const canSeeCode = user?.role === "ADMIN" || user?.role === "TEACHER";

  // --- Add Handlers ---
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    await HierarchyService.createSection({ ...sectionForm, course_id: course.id });
    setAddingSection(false);
    setSectionForm({ name: "", order: 1 });
    fetchCourse();
  };

  const handleCreateChapter = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    await HierarchyService.createChapter({ ...chapterForm, section_id: sectionId });
    setAddingChapterTo(null);
    setChapterForm({ name: "", order: 1 });
    setExpandedSections(prev => ({ ...prev, [sectionId]: true }));
    fetchCourse();
  };

  const handleCreateTopic = async (e: React.FormEvent, chapterId: string) => {
    e.preventDefault();
    await HierarchyService.createTopic({ ...topicForm, chapter_id: chapterId });
    setAddingTopicTo(null);
    setTopicForm({ name: "", description: "", order: 1 });
    setExpandedChapters(prev => ({ ...prev, [chapterId]: true }));
    fetchCourse();
  };

  // --- Edit Handlers ---
  const handleEditSection = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    await HierarchyService.updateSection(sectionId, editSectionForm);
    setEditingSection(null);
    fetchCourse();
  };

  const handleEditChapter = async (e: React.FormEvent, chapterId: string) => {
    e.preventDefault();
    await HierarchyService.updateChapter(chapterId, editChapterForm);
    setEditingChapter(null);
    fetchCourse();
  };

  const handleEditTopic = async (e: React.FormEvent, topicId: string) => {
    e.preventDefault();
    await HierarchyService.updateTopic(topicId, editTopicForm);
    setEditingTopic(null);
    fetchCourse();
  };

  return (
    <>
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
          <div className="mb-6 flex justify-between items-start">
            <div>
              <Link href="/courses" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 mb-4">
                <ChevronLeft size={16} /> Back to Courses
              </Link>
              <SectionTitle 
                title={course.name} 
                subtitle={canSeeCode ? `Course Code: ${course.code}` : "Course Curriculum"} 
              />
            </div>
            {isCreatorOrAdmin && (
              <button 
                onClick={() => setAddingSection(!addingSection)}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition shadow-lg shadow-red-500/20"
              >
                <Plus size={16} /> Add Section
              </button>
            )}
          </div>

          <div className="space-y-8 max-w-5xl">
            {addingSection && (
              <Panel className="border border-red-500/30 bg-black/50">
                <form onSubmit={handleCreateSection} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-xs text-zinc-400 block mb-1">Section Name</label>
                    <input type="text" required value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} className="w-full rounded border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white" />
                  </div>
                  <div className="w-24">
                    <label className="text-xs text-zinc-400 block mb-1">Order</label>
                    <input type="number" required value={sectionForm.order} onChange={e => setSectionForm({...sectionForm, order: Number(e.target.value)})} className="w-full rounded border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500">Save</button>
                    <button type="button" onClick={() => setAddingSection(false)} className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
                  </div>
                </form>
              </Panel>
            )}

            {course.sections?.map((section: any) => (
              <Panel key={section.id} className="p-0 overflow-hidden border border-white/5 bg-zinc-950/50 shadow-md">
                <div 
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-zinc-900 to-zinc-900/50 hover:from-zinc-800 hover:to-zinc-800/50 transition-colors cursor-pointer border-b border-white/5"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg transition-colors ${expandedSections[section.id] ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-400'}`}>
                      <BookOpen size={20} />
                    </div>
                    {editingSection === section.id ? (
                      <form onSubmit={(e) => handleEditSection(e, section.id)} onClick={(e) => e.stopPropagation()} className="flex gap-2 flex-1 max-w-sm">
                        <input autoFocus type="text" value={editSectionForm.name} onChange={e => setEditSectionForm({name: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-sm text-white" />
                        <button type="submit" className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30">Save</button>
                        <button type="button" onClick={() => setEditingSection(null)} className="px-2 py-1 bg-white/5 text-zinc-400 text-xs rounded hover:text-white">Cancel</button>
                      </form>
                    ) : (
                      <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        {section.name}
                        {isCreatorOrAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingSection(section.id); setEditSectionForm({ name: section.name }); }}
                            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {isCreatorOrAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAddingChapterTo(section.id); setExpandedSections(prev => ({...prev, [section.id]: true})); }}
                        className="text-xs bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded transition-colors"
                      >
                        + Add Chapter
                      </button>
                    )}
                    {expandedSections[section.id] ? <ChevronDown size={20} className="text-zinc-500" /> : <ChevronRight size={20} className="text-zinc-500" />}
                  </div>
                </div>

                {expandedSections[section.id] && (
                  <div className="p-5 bg-black/20 space-y-4">
                    {addingChapterTo === section.id && (
                      <div className="p-4 rounded-xl border border-red-500/20 bg-zinc-900/50 mb-4">
                        <form onSubmit={(e) => handleCreateChapter(e, section.id)} className="flex flex-col sm:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                            <label className="text-xs text-zinc-400 block mb-1">Chapter Name</label>
                            <input type="text" required value={chapterForm.name} onChange={e => setChapterForm({...chapterForm, name: e.target.value})} className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white" />
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-zinc-400 block mb-1">Order</label>
                            <input type="number" required value={chapterForm.order} onChange={e => setChapterForm({...chapterForm, order: Number(e.target.value)})} className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white" />
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="rounded bg-zinc-200 text-black px-4 py-2 text-sm hover:bg-white font-medium">Save</button>
                            <button type="button" onClick={() => setAddingChapterTo(null)} className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {section.chapters?.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-4">No chapters in this section.</p>
                    ) : (
                      <div className="space-y-4">
                        {section.chapters?.map((chapter: any) => (
                          <div key={chapter.id} className="rounded-xl border border-white/10 overflow-hidden bg-zinc-900/30">
                            <div 
                              onClick={() => toggleChapter(chapter.id)}
                              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer border-b border-white/5"
                            >
                              <div className="flex-1">
                                {editingChapter === chapter.id ? (
                                  <form onSubmit={(e) => handleEditChapter(e, chapter.id)} onClick={(e) => e.stopPropagation()} className="flex gap-2 flex-1 max-w-sm">
                                    <input autoFocus type="text" value={editChapterForm.name} onChange={e => setEditChapterForm({name: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-sm text-white" />
                                    <button type="submit" className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30">Save</button>
                                    <button type="button" onClick={() => setEditingChapter(null)} className="px-2 py-1 bg-white/5 text-zinc-400 text-xs rounded hover:text-white">Cancel</button>
                                  </form>
                                ) : (
                                  <h4 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                                    <span className="text-zinc-500 text-sm font-normal">Ch {chapter.order}.</span> 
                                    {chapter.name}
                                    {isCreatorOrAdmin && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingChapter(chapter.id); setEditChapterForm({ name: chapter.name }); }}
                                        className="p-1 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                    )}
                                  </h4>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                {isCreatorOrAdmin && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setAddingTopicTo(chapter.id); setExpandedChapters(prev => ({...prev, [chapter.id]: true})); }}
                                    className="text-xs bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white px-2 py-1 rounded transition-colors"
                                  >
                                    + Add Topic
                                  </button>
                                )}
                                {expandedChapters[chapter.id] ? <ChevronDown size={18} className="text-zinc-500" /> : <ChevronRight size={18} className="text-zinc-500" />}
                              </div>
                            </div>

                            {expandedChapters[chapter.id] && (
                              <div className="p-4 bg-black/40 space-y-3">
                                {addingTopicTo === chapter.id && (
                                  <div className="p-4 rounded-lg border border-red-500/20 bg-zinc-900 mb-4">
                                    <form onSubmit={(e) => handleCreateTopic(e, chapter.id)} className="space-y-3">
                                      <div className="flex gap-4">
                                        <div className="flex-1">
                                          <input type="text" placeholder="Topic Name" required value={topicForm.name} onChange={e => setTopicForm({...topicForm, name: e.target.value})} className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white" />
                                        </div>
                                        <div className="w-24">
                                          <input type="number" placeholder="Order" required value={topicForm.order} onChange={e => setTopicForm({...topicForm, order: Number(e.target.value)})} className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white" />
                                        </div>
                                      </div>
                                      <div>
                                        <textarea placeholder="Brief description of the topic (optional)" value={topicForm.description} onChange={e => setTopicForm({...topicForm, description: e.target.value})} className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white min-h-[60px]" />
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                        <button type="button" onClick={() => setAddingTopicTo(null)} className="rounded px-3 py-1.5 text-xs text-zinc-400 hover:text-white">Cancel</button>
                                        <button type="submit" className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-500 font-medium">Save Topic</button>
                                      </div>
                                    </form>
                                  </div>
                                )}

                                {chapter.topics?.length === 0 ? (
                                  <p className="text-sm text-zinc-500 text-center py-2">No topics in this chapter.</p>
                                ) : (
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {chapter.topics?.map((topic: any) => (
                                      <div key={topic.id} className="p-4 rounded-xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-800 transition-all flex flex-col h-full group relative">
                                        {isCreatorOrAdmin && editingTopic !== topic.id && (
                                          <button 
                                            onClick={(e) => { e.preventDefault(); setEditingTopic(topic.id); setEditTopicForm({ name: topic.name, description: topic.description || "" }); }}
                                            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-zinc-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                                            title="Edit Topic"
                                          >
                                            <Edit2 size={12} />
                                          </button>
                                        )}

                                        {editingTopic === topic.id ? (
                                          <form onSubmit={(e) => handleEditTopic(e, topic.id)} className="flex flex-col gap-2 flex-1 z-20">
                                            <input autoFocus type="text" value={editTopicForm.name} onChange={e => setEditTopicForm({...editTopicForm, name: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-sm text-white" />
                                            <textarea value={editTopicForm.description} onChange={e => setEditTopicForm({...editTopicForm, description: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-xs text-zinc-300 min-h-[50px]" />
                                            <div className="flex gap-2 justify-end mt-1">
                                              <button type="button" onClick={() => setEditingTopic(null)} className="px-2 py-1 bg-white/5 text-zinc-400 text-xs rounded hover:text-white">Cancel</button>
                                              <button type="submit" className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30">Save</button>
                                            </div>
                                          </form>
                                        ) : (
                                          <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2 pr-6">
                                              <h5 className="font-medium text-white text-md leading-tight group-hover:text-red-400 transition-colors">{topic.name}</h5>
                                            </div>
                                            {topic.description ? (
                                              <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">{topic.description}</p>
                                            ) : (
                                              <p className="text-xs text-zinc-600 italic mb-4">No description provided.</p>
                                            )}
                                          </div>
                                        )}
                                        
                                        {!editingTopic && (
                                          <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                                            <Link href={`/topics/${topic.id}/notes`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors">
                                              <FileText size={14} /> Notes
                                            </Link>
                                            {topic.has_attempted_tests ? (
                                              <>
                                                <Link href={topic.test_id ? `/tests/${topic.test_id}` : `/topics/${topic.id}/tests`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-colors">
                                                  <CheckCircle size={14} /> Re-attempt
                                                </Link>
                                                {topic.latest_attempt_id && (
                                                  <Link href={`/tests/${topic.test_id}/attempt/${topic.latest_attempt_id}/result`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-xs font-medium text-purple-400 transition-colors">
                                                    <BarChart2 size={14} /> Analysis
                                                  </Link>
                                                )}
                                              </>
                                            ) : (
                                              <Link href={topic.test_id ? `/tests/${topic.test_id}` : `/topics/${topic.id}/tests`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium text-white shadow-lg shadow-red-500/20 transition-all">
                                                <CheckCircle size={14} /> Take Test
                                              </Link>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            ))}
            
            {course.sections?.length === 0 && !addingSection && (
              <Panel className="border border-dashed border-white/10 bg-white/[0.01] text-center py-12">
                <BookOpen size={32} className="mx-auto text-zinc-600 mb-3" />
                <p className="text-sm font-medium text-zinc-400 mb-4">Curriculum is empty for this course.</p>
                {isCreatorOrAdmin && (
                  <button 
                    onClick={() => setAddingSection(true)}
                    className="inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition"
                  >
                    <Plus size={16} /> Add First Section
                  </button>
                )}
              </Panel>
            )}
          </div>

          {(user?.role === "ADMIN" || user?.role === "STUDENT") && (
            <div className="mt-12 max-w-5xl">
              <CourseLeaderboard courseId={courseId} />
            </div>
          )}
        </>
      )}
    </>
  );
}
