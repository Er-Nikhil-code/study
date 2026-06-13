"use client";

import { useEffect, useState, use } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { HierarchyService } from "@/services/hierarchy.service";
import Link from "next/link";
import { ChevronDown, ChevronRight, BookOpen, ChevronLeft, Edit2, Plus, FileText, CheckCircle, BarChart2, Lock, GripVertical, Trash2, Users, Shield, Loader2, Search, Swords } from "lucide-react";
import CourseLeaderboard from "@/components/ui/CourseLeaderboard";
import ChessPiece3D from "@/components/ui/ChessPiece3D";
import { api } from "@/lib/api";
import { adminService } from "@/services/admin.service";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
  
  const isCreatorOrAdmin = user?.role === "ADMIN" || (course && user?.id === course.created_by);

  const { data: knights } = useQuery({
    queryKey: ["knights"],
    queryFn: () => adminService.getUsers({ role: "TEACHER", limit: 100 }),
    enabled: !!isCreatorOrAdmin,
  });

  const { data: pawns } = useQuery({
    queryKey: ["interns"],
    queryFn: () => adminService.getUsers({ role: "INTERN", limit: 100 }),
    enabled: !!isCreatorOrAdmin,
  });

  const { data: enrollments } = useQuery({
    queryKey: ["course_enrollments", courseId],
    queryFn: () => HierarchyService.getCourseEnrollments(courseId as string),
    enabled: user?.role === "ADMIN",
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [searchStudent, setSearchStudent] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);

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
  const [hoveredRingSection, setHoveredRingSection] = useState<{name: string, pct: number, comp: number, total: number} | null>(null);

  const fetchCourse = (isInitial = false) => {
    setLoading(true);
    HierarchyService.getFullHierarchy()
      .then((data) => {
        const c = data.find((c: any) => c.id === courseId);
        if (c) {
          setCourse(c);
          if (isInitial) {
            // Auto-expand first section and chapter for better UX
            if (c.sections?.[0]) {
              setExpandedSections({ [c.sections[0].id]: true });
              if (c.sections[0].chapters?.[0]) {
                setExpandedChapters({ [c.sections[0].chapters[0].id]: true });
              }
            }
          }
        } else {
          setError("Course not found.");
        }
      })
      .catch(() => setError("Failed to load course details."))
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourse(true);
  }, [courseId]);

  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleChapter = (id: string) => setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));

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

  // --- Delete Handlers ---
  const handleDeleteSection = async (e: React.MouseEvent, sectionId: string) => {
    e.stopPropagation();
    if (confirm("Delete this section and all its contents?")) {
      await HierarchyService.deleteSection(sectionId);
      fetchCourse();
    }
  };

  const handleDeleteChapter = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    if (confirm("Delete this chapter and all its topics?")) {
      await HierarchyService.deleteChapter(chapterId);
      fetchCourse();
    }
  };

  const handleDeleteTopic = async (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    if (confirm("Delete this topic?")) {
      await HierarchyService.deleteTopic(topicId);
      fetchCourse();
    }
  };

  const handleDeleteTest = async (e: React.MouseEvent, testId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this test?")) {
      await api.delete(`/tests/${testId}`);
      fetchCourse();
    }
  };

  const handleDeleteCourse = async () => {
    if (confirm("Delete this course entirely?")) {
      await HierarchyService.deleteCourse(course.id);
      router.push("/courses");
    }
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

  if (error) {
    return (
      <div className="rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-red-400">
        {error}
      </div>
    );
  }

  if (!course && loading) {
    return (
      <div className="hidden space-y-6">
        <div className="h-10 w-1/3 bg-white/10 rounded" />
        <div className="h-6 w-1/4 bg-white/5 rounded" />
        <div className="h-40 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <>
      {/* Elegant, minimal loading overlay that keeps the current page visible */}
      {loading && (
        <div className="fixed top-24 right-8 z-50 flex items-center gap-2 rounded-full bg-black/80 border border-white/10 px-4 py-2 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in slide-in-from-top-4">
          <Loader2 className="animate-spin text-red-500" size={14} />
          <span className="text-xs font-medium text-white">Syncing...</span>
        </div>
      )}
      
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'} w-[95%] max-w-[1800px] mx-auto`}>
        {/* Hero Header matching Student Dashboard */}
        <div className="mb-6 flex items-center justify-between gap-6 bg-gradient-to-r from-red-500/10 to-transparent p-6 rounded-2xl relative min-h-[160px]">
          <div className="z-10 w-full">
            <div className="flex justify-between items-start w-full">
              <div className="flex flex-col gap-2">
                <Link href="/courses" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 mb-2">
                  <ChevronLeft size={16} /> Back to Courses
                </Link>
                <SectionTitle 
                  title={course.name} 
                  subtitle={
                    canSeeCode ? (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span>Course Code: {course.code}</span>
                        <span>•</span>
                        <span className="relative group/creator flex items-center gap-1 cursor-help">
                          Creator: <span className="text-zinc-300 hover:text-white transition-colors">{course.creator ? `${course.creator.first_name} ${course.creator.last_name || ''}`.trim() : "King"}</span>
                          
                          <span className="absolute top-full left-0 mt-2 opacity-0 group-hover/creator:opacity-100 group-hover/creator:translate-y-0 translate-y-1 pointer-events-none transition-all duration-200 z-50">
                            <span className="bg-black/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-3 w-64 flex items-start gap-3 pointer-events-auto">
                              {course.creator ? (
                                <>
                                  {course.creator.profile_picture ? (
                                    <img src={course.creator.profile_picture} alt={course.creator.first_name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10" />
                                  ) : (
                                    <span className="w-10 h-10 rounded-full shrink-0 bg-zinc-800 border border-white/5 text-zinc-400 flex items-center justify-center font-bold text-sm">
                                      {course.creator.first_name?.charAt(0)?.toUpperCase() || "U"}
                                    </span>
                                  )}
                                  <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                                    <span className="text-sm font-medium text-white truncate">{course.creator.first_name} {course.creator.last_name}</span>
                                    <span className="text-[10px] text-zinc-400 font-mono truncate" title={course.creator.id}>{course.creator.id}</span>
                                    <span className="text-xs text-red-400 font-medium truncate">{course.creator.email}</span>
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="w-10 h-10 rounded-full shrink-0 bg-red-950 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                    ♚
                                  </span>
                                  <span className="min-w-0 flex-1 flex flex-col gap-0.5">
                                    <span className="text-sm font-bold text-white truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">System King</span>
                                    <span className="text-[10px] text-zinc-400 font-mono truncate uppercase tracking-widest mt-0.5">Supreme Admin</span>
                                    <span className="text-[11px] text-red-400/80 font-medium truncate mt-0.5">Platform Managed</span>
                                  </span>
                                </>
                              )}
                            </span>
                          </span>
                        </span>
                      </span>
                    ) : "Course Curriculum"
                  } 
                />
              </div>

              <div className="flex items-center gap-4 z-20 relative">
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
          </div>
          
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-[radial-gradient(ellipse_at_center,rgba(255,50,50,0.15)_0%,transparent_70%)] pointer-events-none" />
          
          {/* Overall Progress Ring and Logo */}
          {user?.role === "STUDENT" && course.is_enrolled && (
            (() => {
              const S = course.sections?.length || 0;
              if (S === 0) return null;
              
              const r = 48;
              const circ = 2 * Math.PI * r;
              // If all sections are 100% complete, remove gaps to form a perfect full circle
              const allCompleted = course.sections.every((sec: any) => {
                const tTopics = sec.chapters?.flatMap((c:any) => c.topics || []) || [];
                const total = tTopics.length;
                const comp = tTopics.filter((t:any) => t?.is_completed).length;
                return total > 0 && comp === total;
              });
              
              const gapAngle = allCompleted ? 0 : (S > 1 ? 8 : 0);
              const segmentAngle = (360 / S) - gapAngle;
              const segmentLength = (segmentAngle / 360) * circ;

              // Overall completion
              const totalTopics = course.sections?.flatMap((s:any) => s.chapters?.flatMap((c:any) => c.topics || []) || [])?.length || 0;
              const completedTopics = course.sections?.flatMap((s:any) => s.chapters?.flatMap((c:any) => c.topics || []) || [])?.filter((t:any) => t?.is_completed)?.length || 0;
              const overallPct = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

              return (
                <div className="hidden md:flex absolute right-10 top-1/2 -translate-y-1/2 w-40 h-40 z-10 shrink-0 group/container items-center justify-center" onMouseLeave={() => setHoveredRingSection(null)}>
                  <svg className={`absolute inset-0 w-full h-full overflow-visible z-20 pointer-events-none ${overallPct > 0 ? 'animate-[spin_40s_linear_infinite] group-hover/container:[animation-play-state:paused]' : ''}`} viewBox="0 0 100 100">
                    {course.sections.map((sec: any, i: number) => {
                      const tTopics = sec.chapters?.flatMap((c:any) => c.topics || []) || [];
                      const total = tTopics.length;
                      const comp = tTopics.filter((t:any) => t?.is_completed).length;
                      const pct = total === 0 ? 0 : comp / total;
                      const rotation = (360 / S) * i - 90 + (gapAngle / 2);

                      return (
                        <g 
                          key={sec.id} 
                          className="cursor-help transition-all duration-300 hover:opacity-80 group/ring pointer-events-auto"
                          onMouseEnter={() => setHoveredRingSection({ name: sec.name, pct: Math.round(pct * 100), comp, total })}
                        >
                          {/* Background Segment */}
                          <circle 
                            cx="50" cy="50" r="48" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            fill="none" 
                            strokeDasharray={`${segmentLength} ${circ}`}
                            transform={`rotate(${rotation}, 50, 50)`}
                            strokeLinecap="round"
                            className="text-white/10" 
                          />
                          {/* Foreground Segment */}
                          {pct > 0 && (
                            <circle 
                              cx="50" cy="50" r="48" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              fill="none" 
                              strokeDasharray={`${pct * segmentLength} ${circ}`}
                              transform={`rotate(${rotation}, 50, 50)`}
                              strokeLinecap="round"
                              className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)] transition-all duration-1000 ease-out" 
                            />
                          )}
                          {/* Invisible larger hit area for easier hover */}
                          <circle 
                            cx="50" cy="50" r="48" 
                            stroke="transparent" 
                            strokeWidth="10" 
                            fill="none" 
                            strokeDasharray={`${segmentLength} ${circ}`}
                            transform={`rotate(${rotation}, 50, 50)`}
                          />
                        </g>
                      );
                    })}
                  </svg>
                  {/* Logo stays upright */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="w-[120%] h-[120%] drop-shadow-[0_0_30px_rgba(239,68,68,0.4)] pointer-events-auto">
                      <ChessPiece3D role="STUDENT" progressPct={overallPct} />
                    </div>
                  </div>
                  
                  {/* Tooltip */}
                  <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md border border-white/10 text-white text-xs font-semibold tracking-wider px-5 py-3 rounded-xl whitespace-nowrap shadow-[0_10px_40px_rgba(239,68,68,0.2)] pointer-events-none z-50 transition-all duration-200 ${hoveredRingSection ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}`}>
                    {hoveredRingSection && (
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-zinc-400 text-[10px] uppercase max-w-[200px] truncate">{hoveredRingSection.name}</span>
                        <span className="text-red-400 font-bold">{hoveredRingSection.pct}% COMPLETED ({hoveredRingSection.comp}/{hoveredRingSection.total})</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>

          <div className="flex flex-col gap-8 w-full mt-4">
            <div className="flex-1 flex flex-col gap-10 items-start w-full">

              <div className="flex-1 space-y-8 min-w-0 w-full">
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
                className={`p-0 overflow-hidden border ${draggedItem?.id === section.id ? 'opacity-50 border-red-500' : dragOverIndex === idx && dragOverParentId === null && draggedItem?.type === "SECTION" ? 'border-t-2 border-t-red-500 border-white/5' : 'border-white/5'} bg-zinc-950/40 backdrop-blur-md shadow-2xl relative rounded-2xl transition-all duration-300 hover:border-white/10`}
                draggable={isCreatorOrAdmin}
                onDragStart={(e) => handleDragStart(e, section.id, "SECTION", null, idx)}
                onDragOver={(e) => handleDragOver(e, "SECTION", null, idx)}
                onDrop={(e) => handleDrop(e, "SECTION", null, idx)}
                onDragEnd={() => { setDraggedItem(null); setDragOverIndex(null); setDragOverParentId(null); }}
              >
                <div 
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer border-b border-white/5"
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
                      <div className="flex items-center flex-wrap gap-4">
                        <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                          {section.name}
                          {isCreatorOrAdmin && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingSection(section.id); setEditSectionForm({ name: section.name, description: section.description || "" }); }}
                                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => handleDeleteSection(e, section.id)}
                                className="p-1.5 rounded-full hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </h3>
                        {isCreatorOrAdmin && (
                          <div className="flex items-center gap-2 border-l border-white/10 pl-4" onClick={(e) => e.stopPropagation()}>
                            <Shield size={14} className="text-emerald-500/70" />
                            <span className="text-[11px] text-zinc-500 font-medium tracking-wider">MANAGER:</span>
                            <div className="w-44 relative z-20">
                              <SearchableSelect
                                options={[
                                  { value: "", label: "No Manager" },
                                  ...(knights?.data?.map((k: any) => ({
                                    value: k.id,
                                    label: [k.first_name, k.last_name].filter(Boolean).join(" ") || k.name || k.email || "Unknown User",
                                    subLabel: k.id,
                                    image: k.profile_picture
                                  })) || [])
                                ]}
                                value={section.managed_by || ""}
                                onChange={async (val) => {
                                  await HierarchyService.assignSectionManager(section.id, val || null);
                                  fetchCourse();
                                }}
                                placeholder="Assign Manager..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {isCreatorOrAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setAddingChapterTo(section.id); setExpandedSections(prev => ({...prev, [section.id]: true})); }}
                        className="text-xs font-medium bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-400 hover:text-red-400 px-4 py-2 rounded-xl transition-all shadow-sm"
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
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); setEditingChapter(chapter.id); setEditChapterForm({ name: chapter.name, description: chapter.description || "" }); }}
                                          className="p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                                        >
                                          <Edit2 size={12} />
                                        </button>
                                        <button 
                                          onClick={(e) => handleDeleteChapter(e, chapter.id)}
                                          className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </h4>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                {isCreatorOrAdmin && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setAddingTopicTo(chapter.id); setExpandedChapters(prev => ({...prev, [chapter.id]: true})); }}
                                    className="text-[11px] font-medium bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-zinc-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-all shadow-sm"
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
                                  <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
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
                                          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                                            <button 
                                              onClick={() => { setEditingTopic(topic.id); setEditTopicForm({ name: topic.name, description: topic.description || "" }); }}
                                              className="p-1.5 rounded-full bg-black/50 text-zinc-400 hover:text-white hover:bg-white/10"
                                              title="Edit Topic"
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                            <button 
                                              onClick={(e) => handleDeleteTopic(e, topic.id)}
                                              className="p-1.5 rounded-full bg-black/50 text-zinc-400 hover:text-red-400 hover:bg-red-500/20"
                                              title="Delete Topic"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
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
                                          <div className="flex flex-wrap items-center gap-2 mt-auto pt-3 border-t border-white/5">
                                            {topic.has_notes && (
                                              <Link href={`/topics/${topic.id}`} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 transition-colors whitespace-nowrap">
                                                <FileText size={14} /> Notes
                                              </Link>
                                            )}
                                            
                                            {user?.role === "ADMIN" || user?.role === "TEACHER" ? (
                                              <>
                                                {topic.test_id ? (
                                                  <>
                                                    <Link href={`/tests/${topic.test_id}`} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-colors whitespace-nowrap">
                                                      <FileText size={14} /> Test
                                                    </Link>
                                                    <Link href={`/tests/${topic.test_id}`} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-xs font-medium text-purple-400 transition-colors whitespace-nowrap">
                                                      <BarChart2 size={14} /> Analysis
                                                    </Link>
                                                    {isCreatorOrAdmin && (
                                                      <Link href={`/teacher/tests/${topic.test_id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs font-medium text-blue-400 transition-colors whitespace-nowrap">
                                                        <Edit2 size={14} /> Edit
                                                      </Link>
                                                    )}
                                                  </>
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
                                            ) : (
                                              <>
                                                {topic.has_attempted_tests ? (
                                                  <>
                                                    <Link href={`/tests/${topic.test_id}`} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-colors whitespace-nowrap">
                                                      <CheckCircle size={14} /> Re-attempt
                                                    </Link>
                                                    {topic.latest_attempt_id && (
                                                      <Link href={`/results/${topic.latest_attempt_id}?testId=${topic.test_id}&view=analysis`} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-xs font-medium text-purple-400 transition-colors whitespace-nowrap">
                                                        <BarChart2 size={14} /> Analysis
                                                      </Link>
                                                    )}
                                                  </>
                                                ) : (
                                                  <>
                                                    {topic.test_id ? (
                                                      <div className="flex-1 flex gap-1 items-center">
                                                        <Link href={`/tests/${topic.test_id}`} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium text-white shadow-lg shadow-red-500/20 transition-all whitespace-nowrap">
                                                          <CheckCircle size={14} /> Take Test
                                                        </Link>
                                                      </div>
                                                    ) : (
                                                      <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-zinc-500">
                                                        No Test Yet
                                                      </span>
                                                    )}
                                                  </>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
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
                <Panel className="border border-dashed border-white/10 bg-white/[0.01] text-center py-12 mt-8">
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

              {/* Leaderboard Matches Course Box Width */}
              <div className="relative w-full mt-12">
                {String(user?.role) === "STUDENT" && !course?.is_enrolled && (
                  <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-2xl">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-white/10 text-zinc-500 mb-4 shadow-inner">
                      <Lock size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Leaderboard Locked</h3>
                    <p className="text-zinc-400 max-w-sm text-center text-sm">
                      Enroll in the course to view rankings, compare scores, and compete with other warriors.
                    </p>
                  </div>
                )}
                <CourseLeaderboard courseId={courseId} />
              </div>

            </div>
          </div>

          {isCreatorOrAdmin && (
            <div className="w-full lg:w-80 shrink-0 space-y-6">
              <Panel className="bg-zinc-900/50 border-white/10 relative z-20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-red-400" /> Course Knights
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <SearchableSelect
                      options={[
                        { value: "", label: "Assign a Knight...", disabled: true },
                        ...(knights?.data?.map((k: any) => ({
                          value: k.id,
                          label: [k.first_name, k.last_name].filter(Boolean).join(" ") || k.name || k.email || "Unknown User",
                          subLabel: k.id,
                          image: k.profile_picture,
                          disabled: course.staff?.some((s: any) => s.user_id === k.id)
                        })) || [])
                      ]}
                      value=""
                      onChange={async (val) => {
                        if (!val) return;
                        try {
                          await HierarchyService.assignCourseStaff(course.id, val);
                          fetchCourse();
                        } catch (error: any) {
                          alert(error.response?.data?.message || "Failed to assign Knight");
                        }
                      }}
                      placeholder="Search to assign Knight..."
                    />
                  </div>
                  {course.staff?.length > 0 ? (
                    <ul className="space-y-2">
                      {course.staff.map((s: any) => (
                        <li key={s.id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-sm text-white font-medium">{s.user.name}</p>
                            <p className="text-[10px] text-zinc-500">{s.user.email}</p>
                          </div>
                          <button
                            onClick={async () => {
                              await HierarchyService.removeCourseStaff(course.id, s.user_id);
                              fetchCourse();
                            }}
                            className="text-zinc-500 hover:text-red-400 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-500 text-center py-2">No Knights assigned.</p>
                  )}
                </div>
              </Panel>
            </div>
          )}
        </div>

        {/* Bottom Section: Enrolled Students */}
        {user?.role === "ADMIN" && (
          <div className="mt-12 w-full items-start">
            
            {/* Enrolled Students */}
            <div className="mt-8 w-full flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Enrolled Students</h2>
                  <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-md border border-red-400/20 uppercase tracking-wider">
                    Total: {enrollments?.length ?? course.enrollment_count ?? 0}
                  </span>
                </div>
                
                <Panel className="p-0 overflow-hidden border border-white/10 relative z-10 w-full flex-1 flex flex-col">
                  <div className="p-4 border-b border-white/5 bg-black/40">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchStudent}
                        onChange={(e) => {
                          setSearchStudent(e.target.value);
                          setStudentPage(1);
                        }}
                        className="w-full rounded-lg bg-zinc-900/80 border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
                      />
                      <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col h-full bg-zinc-900/20">
                    {(() => {
                      const filtered = (enrollments || []).filter((e: any) => {
                        const term = searchStudent.toLowerCase();
                        const name = `${e.user.first_name || ""} ${e.user.last_name || ""}`.toLowerCase();
                        const id = e.user.id.toLowerCase();
                        return name.includes(term) || id.includes(term);
                      });
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="flex-1 flex items-center justify-center p-8">
                            <p className="text-sm text-zinc-500 text-center">{searchStudent ? "No students match your search." : "No students enrolled yet."}</p>
                          </div>
                        );
                      }

                      const totalPages = Math.ceil(filtered.length / 5);
                      const paginated = filtered.slice((studentPage - 1) * 5, studentPage * 5);

                      return (
                        <div className="flex flex-col h-full">
                          <div className="divide-y divide-white/5">
                            {paginated.map((e: any) => (
                              <div key={e.user.id} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] group/item">
                                {e.user.profile_picture ? (
                                  <img src={e.user.profile_picture} alt={e.user.first_name || e.user.email} className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full shrink-0 bg-zinc-800 border border-white/5 text-zinc-400 flex items-center justify-center font-bold text-sm">
                                    {e.user.first_name?.charAt(0)?.toUpperCase() || e.user.email?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <Link href={`/admin/users/${e.user.id}`} className="text-sm text-white font-medium truncate hover:text-red-400 transition block">
                                    {[e.user.first_name, e.user.last_name].filter(Boolean).join(" ") || "Unknown User"}
                                  </Link>
                                  <p className="text-[10px] text-zinc-500 font-mono break-all mt-1 uppercase tracking-wider" title={e.user.id}>{e.user.id}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-auto border-t border-white/10 bg-black/40 px-4 py-3">
                              <button
                                disabled={studentPage === 1}
                                onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronLeft size={16} className="text-zinc-400" />
                              </button>
                              <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase font-semibold">
                                Page {studentPage} of {totalPages}
                              </span>
                              <button
                                disabled={studentPage === totalPages}
                                onClick={() => setStudentPage(p => Math.min(totalPages, p + 1))}
                                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronRight size={16} className="text-zinc-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </Panel>
              </div>
            </div>
          )}

        {/* Delete Course Button */}
        {isCreatorOrAdmin && (
          <div className="mt-32 pb-12 flex justify-end w-full opacity-60 hover:opacity-100 transition-opacity">
            <button
              onClick={handleDeleteCourse}
              className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-red-400 transition-all hover:bg-red-600 hover:text-white hover:border-red-500"
            >
              Delete Course
            </button>
          </div>
        )}
      </div>
    </>
  );
}
