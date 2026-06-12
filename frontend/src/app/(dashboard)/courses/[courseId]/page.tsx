"use client";

import { useEffect, useState, use } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import Link from "next/link";
import { ChevronDown, ChevronRight, BookOpen, ChevronLeft, Edit2, Plus, FileText, CheckCircle, BarChart2, Lock, GripVertical } from "lucide-react";
import CourseLeaderboard from "@/components/ui/CourseLeaderboard";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { CartService } from "@/services/cart.service";
import { useRouter } from "next/navigation";

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const unwrappedParams = use(params);
  const { courseId } = unwrappedParams;
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // Forms for adding
  const [addingSection, setAddingSection] = useState(false);
  const [addingChapterTo, setAddingChapterTo] = useState<string | null>(null);
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);
  
  const [sectionForm, setSectionForm] = useState({ name: "", description: "", order: 1 });
  const [chapterForm, setChapterForm] = useState({ name: "", description: "", order: 1 });
  const [topicForm, setTopicForm] = useState({ name: "", description: "", order: 1 });

  // Forms for editing
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editSectionForm, setEditSectionForm] = useState({ name: "", description: "" });

  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editChapterForm, setEditChapterForm] = useState({ name: "", description: "" });

  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editTopicForm, setEditTopicForm] = useState({ name: "", description: "" });

  const countWords = (str: string) => str.trim() ? str.trim().split(/\s+/).length : 0;

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: "SECTION" | "CHAPTER" | "TOPIC"; sourceParentId: string | null; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverParentId, setDragOverParentId] = useState<string | null>(null);

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
    if (countWords(sectionForm.description) > 80) {
      alert("Section description cannot exceed 80 words.");
      return;
    }
    await HierarchyService.createSection({ ...sectionForm, course_id: course.id });
    setAddingSection(false);
    setSectionForm({ name: "", description: "", order: 1 });
    fetchCourse();
  };

  const handleCreateChapter = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    if (countWords(chapterForm.description) > 50) {
      alert("Chapter description cannot exceed 50 words.");
      return;
    }
    await HierarchyService.createChapter({ ...chapterForm, section_id: sectionId });
    setAddingChapterTo(null);
    setChapterForm({ name: "", description: "", order: 1 });
    setExpandedSections(prev => ({ ...prev, [sectionId]: true }));
    fetchCourse();
  };

  const handleCreateTopic = async (e: React.FormEvent, chapterId: string) => {
    e.preventDefault();
    if (countWords(topicForm.description) > 20) {
      alert("Topic description cannot exceed 20 words.");
      return;
    }
    await HierarchyService.createTopic({ ...topicForm, chapter_id: chapterId });
    setAddingTopicTo(null);
    setTopicForm({ name: "", description: "", order: 1 });
    setExpandedChapters(prev => ({ ...prev, [chapterId]: true }));
    fetchCourse();
  };

  // --- Edit Handlers ---
  const handleEditSection = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    if (countWords(editSectionForm.description) > 80) {
      alert("Section description cannot exceed 80 words.");
      return;
    }
    await HierarchyService.updateSection(sectionId, editSectionForm);
    setEditingSection(null);
    fetchCourse();
  };

  const handleEditChapter = async (e: React.FormEvent, chapterId: string) => {
    e.preventDefault();
    if (countWords(editChapterForm.description) > 50) {
      alert("Chapter description cannot exceed 50 words.");
      return;
    }
    await HierarchyService.updateChapter(chapterId, editChapterForm);
    setEditingChapter(null);
    fetchCourse();
  };

  const handleEditTopic = async (e: React.FormEvent, topicId: string) => {
    e.preventDefault();
    if (countWords(editTopicForm.description) > 20) {
      alert("Topic description cannot exceed 20 words.");
      return;
    }
    await HierarchyService.updateTopic(topicId, editTopicForm);
    setEditingTopic(null);
    fetchCourse();
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, id: string, type: "SECTION" | "CHAPTER" | "TOPIC", parentId: string | null, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedItem({ id, type, sourceParentId: parentId, index });
  };

  const handleDragOver = (e: React.DragEvent, type: "SECTION" | "CHAPTER" | "TOPIC", parentId: string | null, index: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedItem.type !== type || draggedItem.sourceParentId !== parentId) return;
    if (dragOverIndex !== index || dragOverParentId !== parentId) {
      setDragOverIndex(index);
      setDragOverParentId(parentId);
    }
  };

  const handleDrop = async (e: React.DragEvent, type: "SECTION" | "CHAPTER" | "TOPIC", parentId: string | null, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedItem.type !== type || draggedItem.sourceParentId !== parentId) {
      setDraggedItem(null);
      setDragOverIndex(null);
      setDragOverParentId(null);
      return;
    }

    const { index: dragIndex } = draggedItem;
    if (dragIndex === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      setDragOverParentId(null);
      return;
    }

    const newCourse = { ...course };
    let listToReorder: any[] = [];
    
    if (type === "SECTION") {
      listToReorder = Array.from(newCourse.sections);
    } else if (type === "CHAPTER") {
      const secIdx = newCourse.sections.findIndex((s: any) => s.id === parentId);
      if (secIdx > -1) listToReorder = Array.from(newCourse.sections[secIdx].chapters);
    } else if (type === "TOPIC") {
      for (let s of newCourse.sections) {
        const cIdx = s.chapters.findIndex((c: any) => c.id === parentId);
        if (cIdx > -1) {
          listToReorder = Array.from(s.chapters[cIdx].topics);
          break;
        }
      }
    }

    if (!listToReorder || listToReorder.length === 0) return;

    // Swap items
    const [movedItem] = listToReorder.splice(dragIndex, 1);
    listToReorder.splice(dropIndex, 0, movedItem);

    // Prepare updated array
    const updatedItemsPayload: any[] = [];
    listToReorder.forEach((item, idx) => {
      item.order = idx + 1;
      updatedItemsPayload.push({ id: item.id, type, order: item.order });
    });

    if (type === "SECTION") {
      newCourse.sections = listToReorder;
    } else if (type === "CHAPTER") {
      const secIdx = newCourse.sections.findIndex((s: any) => s.id === parentId);
      if (secIdx > -1) newCourse.sections[secIdx].chapters = listToReorder;
    } else if (type === "TOPIC") {
      for (let s of newCourse.sections) {
        const cIdx = s.chapters.findIndex((c: any) => c.id === parentId);
        if (cIdx > -1) {
          s.chapters[cIdx].topics = listToReorder;
          break;
        }
      }
    }

    setCourse(newCourse);
    setDraggedItem(null);
    setDragOverIndex(null);
    setDragOverParentId(null);

    try {
      await HierarchyService.reorder(updatedItemsPayload);
    } catch (err) {
      alert("Failed to save new order.");
      fetchCourse();
    }
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
            <div className="flex items-center gap-4">
              {user?.role === "STUDENT" && !course.is_enrolled && (
                <button
                  onClick={async () => {
                    try {
                      if (course.price > 0 || course.discount_price > 0) {
                        await CartService.addToCart(course.id);
                        queryClient.invalidateQueries({ queryKey: ["cart"] });
                        router.push("/student/cart");
                      } else {
                        await HierarchyService.enrollCourse(course.id);
                        queryClient.invalidateQueries({ queryKey: ["courses", "hierarchy"] });
                        fetchCourse();
                      }
                    } catch (e) {
                      alert("Failed to enroll or add to cart");
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-500 hover:to-red-400 transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  <Lock size={16} />
                  {(course.price > 0 || course.discount_price > 0) ? "Add to Cart" : "Enroll Now"}
                </button>
              )}
              {isCreatorOrAdmin && (
                <button 
                  onClick={() => setAddingSection(!addingSection)}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition shadow-lg shadow-red-500/20"
                >
                  <Plus size={16} /> Add Section
                </button>
              )}
            </div>
          </div>

          <div className="space-y-8 max-w-5xl">
            {addingSection && (
              <Panel className="border border-red-500/30 bg-black/50">
                <form onSubmit={handleCreateSection} className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-end w-full">
                    <div className="flex-1 w-full">
                      <label className="text-xs text-zinc-400 block mb-1">Section Name</label>
                      <input type="text" required value={sectionForm.name} onChange={e => setSectionForm({...sectionForm, name: e.target.value})} className="w-full rounded border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white" />
                    </div>
                    <div className="w-24">
                      <label className="text-xs text-zinc-400 block mb-1">Order</label>
                      <input type="number" min="1" required value={sectionForm.order} onChange={e => setSectionForm({...sectionForm, order: Number(e.target.value)})} className="w-full rounded border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-zinc-400 block">Description (Max 80 words)</label>
                      <span className={`text-[10px] ${countWords(sectionForm.description) > 80 ? 'text-red-500' : 'text-zinc-500'}`}>{countWords(sectionForm.description)} / 80</span>
                    </div>
                    <textarea required value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})} className="w-full rounded border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white min-h-[60px]" placeholder="Enter section description..." />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500">Save</button>
                    <button type="button" onClick={() => setAddingSection(false)} className="rounded px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
                  </div>
                </form>
              </Panel>
            )}

            {course.sections?.map((section: any, idx: number) => (
              <Panel 
                key={section.id} 
                className={`p-0 overflow-hidden border ${draggedItem?.id === section.id ? 'opacity-50 border-red-500' : dragOverIndex === idx && dragOverParentId === null && draggedItem?.type === "SECTION" ? 'border-t-2 border-t-red-500 border-white/5' : 'border-white/5'} bg-zinc-950/50 shadow-md relative`}
                draggable={isCreatorOrAdmin}
                onDragStart={(e) => handleDragStart(e, section.id, "SECTION", null, idx)}
                onDragOver={(e) => handleDragOver(e, "SECTION", null, idx)}
                onDrop={(e) => handleDrop(e, "SECTION", null, idx)}
                onDragEnd={() => { setDraggedItem(null); setDragOverIndex(null); setDragOverParentId(null); }}
              >
                <div 
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-zinc-900 to-zinc-900/50 hover:from-zinc-800 hover:to-zinc-800/50 transition-colors cursor-pointer border-b border-white/5"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {isCreatorOrAdmin && (
                      <div className="cursor-grab hover:text-white text-zinc-500 px-1 py-4 flex items-center">
                        <GripVertical size={16} />
                      </div>
                    )}
                    <div className={`p-2 rounded-lg transition-colors ${expandedSections[section.id] ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-400'}`}>
                      <BookOpen size={20} />
                    </div>
                    {editingSection === section.id ? (
                      <form onSubmit={(e) => handleEditSection(e, section.id)} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-2 flex-1 max-w-lg">
                        <div className="flex gap-2 w-full">
                          <input autoFocus type="text" value={editSectionForm.name} onChange={e => setEditSectionForm({...editSectionForm, name: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-sm text-white" placeholder="Section name" />
                          <button type="submit" className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30">Save</button>
                          <button type="button" onClick={() => setEditingSection(null)} className="px-3 py-1 bg-white/5 text-zinc-400 text-xs rounded hover:text-white">Cancel</button>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1 px-1">
                            <label className="text-[10px] text-zinc-500">Description (Max 80 words)</label>
                            <span className={`text-[10px] ${countWords(editSectionForm.description) > 80 ? 'text-red-500' : 'text-zinc-500'}`}>{countWords(editSectionForm.description)} / 80</span>
                          </div>
                          <textarea required value={editSectionForm.description} onChange={e => setEditSectionForm({...editSectionForm, description: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-sm text-white min-h-[40px]" placeholder="Section description..." />
                        </div>
                      </form>
                    ) : (
                      <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        {section.name}
                        {isCreatorOrAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingSection(section.id); setEditSectionForm({ name: section.name, description: section.description || "" }); }}
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
                            <input type="number" min="1" required value={chapterForm.order} onChange={e => setChapterForm({...chapterForm, order: Number(e.target.value)})} className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white" />
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
                        {section.chapters?.map((chapter: any, idx: number) => (
                          <div 
                            key={chapter.id} 
                            className={`rounded-xl border overflow-hidden ${draggedItem?.id === chapter.id ? 'opacity-50 border-red-500' : dragOverIndex === idx && dragOverParentId === section.id && draggedItem?.type === "CHAPTER" ? 'border-t-2 border-t-red-500 border-white/10' : 'border-white/10'} bg-zinc-900/30 relative`}
                            draggable={isCreatorOrAdmin}
                            onDragStart={(e) => handleDragStart(e, chapter.id, "CHAPTER", section.id, idx)}
                            onDragOver={(e) => handleDragOver(e, "CHAPTER", section.id, idx)}
                            onDrop={(e) => handleDrop(e, "CHAPTER", section.id, idx)}
                            onDragEnd={() => { setDraggedItem(null); setDragOverIndex(null); setDragOverParentId(null); }}
                          >
                            <div 
                              onClick={() => toggleChapter(chapter.id)}
                              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer border-b border-white/5"
                            >
                              <div className="flex-1 flex items-center gap-3">
                                {isCreatorOrAdmin && (
                                  <div className="cursor-grab hover:text-white text-zinc-600 px-1 py-1">
                                    <GripVertical size={14} />
                                  </div>
                                )}
                                {editingChapter === chapter.id ? (
                                  <form onSubmit={(e) => handleEditChapter(e, chapter.id)} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-2 flex-1 max-w-sm">
                                    <div className="flex gap-2 w-full">
                                      <input autoFocus type="text" value={editChapterForm.name} onChange={e => setEditChapterForm({...editChapterForm, name: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-sm text-white" placeholder="Chapter name" />
                                      <button type="submit" className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30">Save</button>
                                      <button type="button" onClick={() => setEditingChapter(null)} className="px-2 py-1 bg-white/5 text-zinc-400 text-xs rounded hover:text-white">Cancel</button>
                                    </div>
                                    <div>
                                      <div className="flex justify-between items-center mb-1 px-1">
                                        <label className="text-[10px] text-zinc-500">Description (Max 50 words)</label>
                                        <span className={`text-[10px] ${countWords(editChapterForm.description) > 50 ? 'text-red-500' : 'text-zinc-500'}`}>{countWords(editChapterForm.description)} / 50</span>
                                      </div>
                                      <textarea required value={editChapterForm.description} onChange={e => setEditChapterForm({...editChapterForm, description: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-sm text-white min-h-[40px]" placeholder="Chapter description..." />
                                    </div>
                                  </form>
                                ) : (
                                  <h4 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                                    <span className="text-zinc-500 text-sm font-normal">Ch {idx + 1}.</span> 
                                    {chapter.name}
                                    {isCreatorOrAdmin && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingChapter(chapter.id); setEditChapterForm({ name: chapter.name, description: chapter.description || "" }); }}
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
                                          <input type="number" min="1" placeholder="Order" required value={topicForm.order} onChange={e => setTopicForm({...topicForm, order: Number(e.target.value)})} className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white" />
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex justify-between items-center mb-1">
                                          <label className="text-[10px] text-zinc-500">Description (Max 20 words)</label>
                                          <span className={`text-[10px] ${countWords(topicForm.description) > 20 ? 'text-red-500' : 'text-zinc-500'}`}>{countWords(topicForm.description)} / 20</span>
                                        </div>
                                        <textarea required placeholder="Brief description of the topic" value={topicForm.description} onChange={e => setTopicForm({...topicForm, description: e.target.value})} className="w-full rounded border border-white/10 bg-black px-3 py-2 text-sm text-white min-h-[60px]" />
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
                                    {chapter.topics?.map((topic: any, idx: number) => {
                                      const absoluteTopicIdx = section.chapters?.flatMap((c:any) => c.topics || []).findIndex((t:any) => t?.id === topic.id);
                                      const isPreviewLocked = user?.role === "STUDENT" && !course.is_enrolled && absoluteTopicIdx >= 2;

                                      return isPreviewLocked ? (
                                        <div 
                                          key={topic.id} 
                                          onClick={() => {
                                            alert("This topic is locked in the free preview. Please enroll in or purchase the course to unlock it.");
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="p-4 rounded-xl border border-white/5 bg-black/40 hover:bg-black/60 transition-all flex flex-col h-full group relative cursor-pointer"
                                        >
                                          <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2 pr-6">
                                              <div className="flex items-center gap-2">
                                                <div className="text-zinc-600"><Lock size={16} /></div>
                                                <h5 className="font-medium text-zinc-500 text-md leading-tight">{topic.name}</h5>
                                              </div>
                                            </div>
                                            <p className="text-[11px] text-zinc-600 font-medium mb-4 uppercase tracking-wider">Locked. Enroll to view contents.</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div 
                                          key={topic.id} 
                                          className={`p-4 rounded-xl border ${draggedItem?.id === topic.id ? 'opacity-50 border-red-500' : dragOverIndex === idx && dragOverParentId === chapter.id && draggedItem?.type === "TOPIC" ? 'border-t-2 border-t-red-500 border-white/5' : 'border-white/5'} bg-zinc-900/50 hover:bg-zinc-800 transition-all flex flex-col h-full group relative cursor-default`}
                                          draggable={isCreatorOrAdmin}
                                          onDragStart={(e) => handleDragStart(e, topic.id, "TOPIC", chapter.id, idx)}
                                          onDragOver={(e) => handleDragOver(e, "TOPIC", chapter.id, idx)}
                                          onDrop={(e) => handleDrop(e, "TOPIC", chapter.id, idx)}
                                          onDragEnd={() => { setDraggedItem(null); setDragOverIndex(null); setDragOverParentId(null); }}
                                        >
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
                                            <div>
                                              <div className="flex justify-between items-center mb-1 px-1">
                                                <label className="text-[10px] text-zinc-500">Description (Max 20 words)</label>
                                                <span className={`text-[10px] ${countWords(editTopicForm.description) > 20 ? 'text-red-500' : 'text-zinc-500'}`}>{countWords(editTopicForm.description)} / 20</span>
                                              </div>
                                              <textarea required value={editTopicForm.description} onChange={e => setEditTopicForm({...editTopicForm, description: e.target.value})} className="w-full rounded bg-black border border-white/20 px-2 py-1 text-xs text-zinc-300 min-h-[50px]" />
                                            </div>
                                            <div className="flex gap-2 justify-end mt-1">
                                              <button type="button" onClick={() => setEditingTopic(null)} className="px-2 py-1 bg-white/5 text-zinc-400 text-xs rounded hover:text-white">Cancel</button>
                                              <button type="submit" className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded hover:bg-emerald-500/30">Save</button>
                                            </div>
                                          </form>
                                        ) : (
                                          <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2 pr-6">
                                              <div className="flex items-center gap-2">
                                                {isCreatorOrAdmin && (
                                                  <div className="cursor-grab hover:text-white text-zinc-600">
                                                    <GripVertical size={14} />
                                                  </div>
                                                )}
                                                {topic.is_completed ? (
                                                  <CheckCircle size={16} className="text-emerald-500 fill-emerald-500/20" />
                                                ) : (
                                                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600 shrink-0" />
                                                )}
                                                <h5 className="font-medium text-white text-md leading-tight group-hover:text-red-400 transition-colors">{topic.name}</h5>
                                              </div>
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
                                            {topic.has_notes && (
                                              <Link href={`/topics/${topic.id}/notes`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors">
                                                <FileText size={14} /> Notes
                                              </Link>
                                            )}
                                            {topic.has_attempted_tests ? (
                                              <>
                                                <Link href={`/tests/${topic.test_id}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-colors">
                                                  <CheckCircle size={14} /> Re-attempt
                                                </Link>
                                                {topic.latest_attempt_id && (
                                                  <Link href={`/tests/${topic.test_id}/attempt/${topic.latest_attempt_id}/result`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-xs font-medium text-purple-400 transition-colors">
                                                    <BarChart2 size={14} /> Analysis
                                                  </Link>
                                                )}
                                              </>
                                            ) : (
                                              <>
                                                {topic.test_id ? (
                                                  <Link href={`/tests/${topic.test_id}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium text-white shadow-lg shadow-red-500/20 transition-all">
                                                    <CheckCircle size={14} /> Take Test
                                                  </Link>
                                                ) : isCreatorOrAdmin ? (
                                                  <Link href={`/teacher/tests/create?topic_id=${topic.id}&topic_name=${encodeURIComponent(topic.name)}`} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white shadow-lg shadow-emerald-500/20 transition-all">
                                                    <Plus size={14} /> Create Test
                                                  </Link>
                                                ) : (
                                                  <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-zinc-500">
                                                    No Test Yet
                                                  </span>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}
                                        )}
                                      </div>
                                    )})}
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
          )}

          {(user?.role === "ADMIN" || user?.role === "STUDENT") && (
            <div className="mt-12 max-w-5xl relative">
              {user?.role === "STUDENT" && !course.is_enrolled && (
                <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-2xl">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-white/10 text-zinc-500 mb-4 shadow-inner">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Leaderboard Locked</h3>
                  <p className="text-zinc-400 max-w-sm text-center text-sm">
                    Enroll in the course to view rankings, compare scores, and compete with other students.
                  </p>
                </div>
              )}
              <CourseLeaderboard courseId={courseId} />
            </div>
          )}
        </>
      )}
    </>
  );
}
