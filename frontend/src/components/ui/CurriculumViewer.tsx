"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  FileText,
  BarChart2,
  Lock,
  Edit2,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Shield,
  Layers,
  Atom,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { getSecureUrl } from "@/lib/secure-url";
import TestProgressBar from "@/components/ui/TestProgressBar";
import MultiSearchableSelect from "@/components/ui/MultiSearchableSelect";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurriculumViewerProps {
  /** The full course/series object */
  data: any;
  /** "course" | "test-series" */
  mode: "course" | "test-series";
  user: any;
  knights?: any[];
  /** Whether current user can manage this section */
  isSectionManager: (section: any) => boolean;
  isCreatorOrAdmin: boolean;
  // CRUD callbacks (all optional — warrior-only view omits them)
  onAddChapter?: (sectionId: string, form: any) => Promise<void>;
  onAddTopic?: (chapterId: string, form: any) => Promise<void>;
  onEditSection?: (sectionId: string, form: any) => Promise<void>;
  onEditChapter?: (chapterId: string, form: any) => Promise<void>;
  onEditTopic?: (topicId: string, form: any) => Promise<void>;
  onDeleteSection?: (sectionId: string) => Promise<void>;
  onDeleteChapter?: (chapterId: string) => Promise<void>;
  onDeleteTopic?: (topicId: string) => Promise<void>;
  onDeleteTest?: (testId: string) => Promise<void>;
  onUploadNote?: (topicId: string, topicName: string) => Promise<void>;
  onAssignManagers?: (sectionId: string, userIds: string[]) => Promise<void>;
  onDrop?: (
    type: "SECTION" | "CHAPTER" | "TOPIC",
    parentId: string | null,
    fromIdx: number,
    toIdx: number
  ) => Promise<void>;
}

const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// ─── Inline mini-form helper ──────────────────────────────────────────────────

function InlineForm({
  label,
  maxWords,
  onSave,
  onCancel,
  initial = { name: "", description: "", order: 1 },
}: {
  label: string;
  maxWords: number;
  onSave: (v: { name: string; description: string; order: number }) => void;
  onCancel: () => void;
  initial?: { name: string; description: string; order: number | string };
}) {
  const [form, setForm] = useState({ name: initial.name, description: initial.description, order: initial.order as number });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="p-4 rounded-xl border border-red-500/20 bg-black/60 backdrop-blur-md space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-2">
        <input
          autoFocus
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={`${label} name`}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500/50"
        />
        <input
          type="number"
          min={1}
          required
          value={form.order}
          onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 1 })}
          className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/50"
        />
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-zinc-500">Description (max {maxWords} words)</span>
          <span className={`text-[10px] ${countWords(form.description) > maxWords ? "text-red-400" : "text-zinc-600"}`}>
            {countWords(form.description)}/{maxWords}
          </span>
        </div>
        <textarea
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="Brief description…"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-red-500/50 resize-none"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs text-zinc-400 hover:text-white transition">
          Cancel
        </button>
        <button type="submit" className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition">
          Save
        </button>
      </div>
    </form>
  );
}

// ─── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({
  topic,
  idx,
  chapter,
  section,
  data,
  user,
  mode,
  isSectionManager,
  onEditTopic,
  onDeleteTopic,
  onUploadNote,
  onDeleteTest,
  dragProps,
}: any) {
  const [editing, setEditing] = useState(false);
  const canManage = isSectionManager(section);

  const allTopics = section.chapters?.flatMap((c: any) => c.topics || []) || [];
  const absoluteIdx = allTopics.findIndex((t: any) => t?.id === topic.id);
  const isPreviewLocked =
    user?.role === "STUDENT" && !data.is_enrolled && absoluteIdx >= 2;

  if (isPreviewLocked) {
    return (
      <div className="group relative p-4 rounded-xl border border-white/[0.08]
        bg-gradient-to-b from-white/[0.04] to-white/[0.02]
        shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]
        backdrop-blur-sm cursor-not-allowed">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={13} className="text-zinc-600 shrink-0" />
          <span className="text-sm font-medium text-zinc-600 line-clamp-1">{topic.name}</span>
        </div>
        <p className="text-[10px] text-zinc-700 uppercase tracking-wider">Enroll to unlock</p>
      </div>
    );
  }

  return (
    <div
      {...dragProps}
      className={`group relative flex flex-col p-4 rounded-xl border backdrop-blur-sm
        transition-[transform,box-shadow,border-color,background-color] duration-200
        ${
          dragProps?.["data-dragging"]
            ? "opacity-40 border-red-500/50 scale-95"
            : `border-white/[0.09] bg-gradient-to-b from-white/[0.06] to-white/[0.03]
               shadow-[0_4px_12px_rgba(0,0,0,0.5),0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]
               hover:-translate-y-0.5
               hover:border-white/[0.18]
               hover:shadow-[0_8px_24px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.10),0_0_0_1px_rgba(255,255,255,0.04)]`
        }`}
    >
      {/* Edit/Delete controls */}
      {canManage && !editing && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
          {canManage && (
            <div className="cursor-grab text-zinc-600 hover:text-zinc-400 mr-1">
              <GripVertical size={12} />
            </div>
          )}
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded-md bg-black/50 text-zinc-500 hover:text-white hover:bg-white/10 transition"
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteTopic?.(topic.id); }}
            className="p-1 rounded-md bg-black/50 text-zinc-500 hover:text-red-400 hover:bg-red-500/20 transition"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {editing ? (
        <InlineForm
          label="Topic"
          maxWords={20}
          initial={{ name: topic.name, description: topic.description || "", order: topic.order || idx + 1 }}
          onSave={async (v) => { await onEditTopic?.(topic.id, v); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1.5 pr-14">
            {topic.is_completed ? (
              <CheckCircle size={14} className="text-emerald-400 fill-emerald-400/20 shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-500 shrink-0" />
            )}
            <span className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors duration-150 line-clamp-2 leading-snug">
              {topic.name}
            </span>
          </div>

          {/* Description */}
          {topic.description && (
            <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
              {topic.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
            {/* Notes */}
            {topic.has_notes ? (
              <a
                href={
                  topic.first_note
                    ? `/notes-viewer?url=${encodeURIComponent(getSecureUrl(topic.first_note.pdf_url))}&title=${encodeURIComponent(topic.first_note.title)}&noteId=${topic.first_note.id}`
                    : `/topics/${topic.id}`
                }
                target={topic.first_note ? "_blank" : undefined}
                rel={topic.first_note ? "opener" : undefined}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-medium text-zinc-300 transition-colors"
              >
                <FileText size={12} /> Notes
              </a>
            ) : canManage && (
              <button
                onClick={() => onUploadNote?.(topic.id, topic.name)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-medium text-amber-400 transition"
              >
                <Upload size={12} /> Upload Note
              </button>
            )}

            {/* Test CTA */}
            {user?.role === "ADMIN" || user?.role === "TEACHER" ? (
              <>
                {topic.test_id ? (
                  <>
                    <Link
                      href={`/tests/${topic.test_id}`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[11px] font-medium text-red-400 transition"
                    >
                      <ClipboardList size={12} /> Test
                    </Link>
                    <Link
                      href={`/teacher/tests/${topic.test_id}/edit`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-[11px] font-medium text-purple-400 transition"
                    >
                      <TrendingUp size={12} /> Analysis
                    </Link>
                    {canManage && (
                      <Link
                        href={`/teacher/tests/${topic.test_id}/edit`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-[11px] font-medium text-blue-400 transition"
                      >
                        <Edit2 size={12} /> Edit
                      </Link>
                    )}
                  </>
                ) : canManage ? (
                  <Link
                    href={`/teacher/tests/create?topic_id=${topic.id}&topic_name=${encodeURIComponent(topic.name)}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white shadow-lg shadow-emerald-500/20 transition"
                  >
                    <Plus size={12} /> Create Test
                  </Link>
                ) : (
                  <span className="text-[11px] text-zinc-500">No test yet</span>
                )}
              </>
            ) : (
              <>
                {topic.has_attempted_tests ? (
                  <>
                    <Link
                      href={`/tests/${topic.test_id}`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[11px] font-medium text-red-400 transition"
                    >
                      <CheckCircle size={12} /> Re-attempt
                    </Link>
                    {topic.latest_attempt_id && (
                      <Link
                        href={`/results/${topic.latest_attempt_id}?testId=${topic.test_id}&view=analysis`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-[11px] font-medium text-purple-400 transition"
                      >
                        <BarChart2 size={12} /> Analysis
                      </Link>
                    )}
                  </>
                ) : topic.test_id ? (
                  <Link
                    href={`/tests/${topic.test_id}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-[11px] font-bold text-white shadow-lg shadow-red-500/20 transition"
                  >
                    <ClipboardList size={12} /> Take Test
                  </Link>
                ) : (
                  <span className="text-[11px] text-zinc-600">No test yet</span>
                )}
              </>
            )}
          </div>

          {/* Score bar */}
          {topic.tests?.[0] && (
            <div className="mt-2">
              <TestProgressBar
                score={topic.tests[0].score}
                totalMarks={topic.tests[0].total_marks}
                passingMarks={topic.tests[0].passing_marks}
                rank={topic.tests[0].rank}
                totalAspirants={topic.tests[0].total_aspirants}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CurriculumViewer({
  data,
  mode,
  user,
  knights = [],
  isSectionManager,
  isCreatorOrAdmin,
  onAddChapter,
  onAddTopic,
  onEditSection,
  onEditChapter,
  onEditTopic,
  onDeleteSection,
  onDeleteChapter,
  onDeleteTopic,
  onDeleteTest,
  onUploadNote,
  onAssignManagers,
  onDrop,
}: CurriculumViewerProps) {
  const sections = data?.sections || [];

  // active selections
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || "");
  const [activeChapterId, setActiveChapterId] = useState<string>(sections[0]?.chapters?.[0]?.id || "");
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);

  // inline add-form visibility
  const [addingChapterTo, setAddingChapterTo] = useState<string | null>(null);
  const [addingTopicTo, setAddingTopicTo] = useState<string | null>(null);

  // inline edit-form visibility
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // drag state (per-list)
  const [dragging, setDragging] = useState<{ id: string; type: string; parentId: string | null; idx: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ parentId: string | null; idx: number } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("last_curriculum_url", window.location.pathname);
    }
  }, []);

  const displaySectionId = hoveredSectionId || activeSectionId;
  const activeSection = sections.find((s: any) => s.id === displaySectionId) || sections[0];
  const chapters = activeSection?.chapters || [];
  // Use activeChapterId only if it belongs to the displaySection, else fall back to the section's first chapter
  const isValidChapter = chapters.some((c: any) => c.id === activeChapterId);
  const activeChapter = isValidChapter 
    ? chapters.find((c: any) => c.id === activeChapterId) 
    : chapters[0];
  const topics = activeChapter?.topics || [];

  // auto-select first chapter when section changes
  const switchSection = (sId: string) => {
    setActiveSectionId(sId);
    const sec = sections.find((s: any) => s.id === sId);
    setActiveChapterId(sec?.chapters?.[0]?.id || "");
    setAddingChapterTo(null);
    setAddingTopicTo(null);
  };

  // section progress helpers
  const sectionProgress = (sec: any) => {
    const all = sec.chapters?.flatMap((c: any) => c.topics || []) || [];
    const done = all.filter((t: any) => t?.is_completed).length;
    return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  };

  const chapterProgress = (ch: any) => {
    const all = ch.topics || [];
    const done = all.filter((t: any) => t?.is_completed).length;
    return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  };

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <BookOpen size={28} className="text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm">No curriculum added yet.</p>
      </div>
    );
  }

  return (
    <div 
      className="flex gap-2 w-full min-h-[600px] max-h-[calc(100vh-260px)] items-start select-none overflow-hidden"
      onMouseLeave={() => setHoveredSectionId(null)}
    >

      {/* ── PANEL 1: Sections Rail — collapses to ~52px, expands on hover ── */}
      <div className="group/sec shrink-0 flex flex-col overflow-y-auto scrollbar-none
        w-[52px] hover:w-56 transition-[width] duration-300 ease-in-out
        border-r border-white/[0.06] pr-2 mr-1">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5 whitespace-nowrap overflow-hidden">
          <Layers size={10} className="shrink-0" />
          <span className="opacity-0 group-hover/sec:opacity-100 transition-opacity duration-200">Sections</span>
        </div>

        {sections.map((section: any, sIdx: number) => {
          const { done, total, pct } = sectionProgress(section);
          const isActive = section.id === activeSectionId;
          const canManage = isSectionManager(section);

          return (
            <div key={section.id} className="group/item relative mb-1">
              {editingSectionId === section.id ? (
                <InlineForm
                  label="Section"
                  maxWords={80}
                  initial={{ name: section.name, description: section.description || "", order: section.order || sIdx + 1 }}
                  onSave={async (v) => { await onEditSection?.(section.id, v); setEditingSectionId(null); }}
                  onCancel={() => setEditingSectionId(null)}
                />
              ) : (
                <button
                  onClick={() => switchSection(section.id)}
                  onMouseEnter={() => setHoveredSectionId(section.id)}
                  title={section.name}
                  className={`w-full text-left px-2.5 py-2.5 rounded-xl border transition-all duration-200 relative overflow-hidden
                    ${isActive
                      ? "bg-red-500/10 border-red-500/25 shadow-[0_0_0_1px_rgba(239,68,68,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]"
                      : "bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-red-500 rounded-r shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                  )}

                  {/* Collapsed: just index dot */}
                  <div className="flex items-center gap-2">
                    <div className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold
                      ${isActive ? "bg-red-500/20 text-red-400" : "bg-white/5 text-zinc-500"}`}>
                      {sIdx + 1}
                    </div>
                    {/* Expanded content — hidden when rail is narrow */}
                    <div className="flex-1 min-w-0 opacity-0 group-hover/sec:opacity-100 transition-opacity duration-200 overflow-hidden">
                      <p className={`text-[11px] font-semibold leading-snug truncate ${isActive ? "text-white" : "text-zinc-300"}`}>
                        {section.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] text-zinc-500 shrink-0">
                          {section.chapters?.length || 0} ch
                        </p>
                        {total > 0 && (
                          <>
                            <div className="flex-1 h-px rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-red-500/60"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-[9px] font-bold tabular-nums shrink-0 ${pct === 100 ? "text-emerald-400" : "text-zinc-600"}`}>
                              {pct}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="absolute top-1 right-1 hidden group-hover/item:flex items-center gap-0.5">
                      <button onClick={(e) => { e.stopPropagation(); setEditingSectionId(section.id); }} className="p-0.5 rounded bg-black/60 text-zinc-500 hover:text-white">
                        <Edit2 size={9} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteSection?.(section.id); }} className="p-0.5 rounded bg-black/60 text-zinc-500 hover:text-red-400">
                        <Trash2 size={9} />
                      </button>
                    </div>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── PANEL 2: Chapters — collapses to ~52px, expands on hover ──── */}
      <div className="group/ch shrink-0 flex flex-col overflow-y-auto scrollbar-none
        w-[52px] hover:w-52 transition-[width] duration-300 ease-in-out
        border-r border-white/[0.06] pr-2 mr-1">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1 mb-2 flex items-center justify-between whitespace-nowrap">
          <span className="flex items-center gap-1.5">
            <BookOpen size={10} className="shrink-0" />
            <span className="opacity-0 group-hover/ch:opacity-100 transition-opacity duration-200">Chapters</span>
          </span>
          {activeSection && isSectionManager(activeSection) && (
            <button
              onClick={() => setAddingChapterTo(activeSection.id)}
              className="opacity-0 group-hover/ch:opacity-100 transition-opacity duration-200 flex items-center gap-0.5 text-red-400 hover:text-red-300 text-[10px]"
            >
              <Plus size={10} /> Add
            </button>
          )}
        </div>

        {addingChapterTo === activeSection?.id && (
          <div className="mb-3">
            <InlineForm
              label="Chapter"
              maxWords={50}
              initial={{ name: "", description: "", order: (chapters.length || 0) + 1 }}
              onSave={async (v) => { await onAddChapter?.(activeSection.id, v); setAddingChapterTo(null); }}
              onCancel={() => setAddingChapterTo(null)}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 flex-1">
          {chapters.length === 0 && (
            <p className="text-xs text-zinc-600 text-center py-6">No chapters yet.</p>
          )}
          {chapters.map((chapter: any, cIdx: number) => {
            const { done, total, pct } = chapterProgress(chapter);
            const isActive = chapter.id === activeChapterId;
            const canManage = isSectionManager(activeSection);

            return (
              <div key={chapter.id} className="group/ch-item relative mb-1">
                {editingChapterId === chapter.id ? (
                  <InlineForm
                    label="Chapter"
                    maxWords={50}
                    initial={{ name: chapter.name, description: chapter.description || "", order: chapter.order || cIdx + 1 }}
                    onSave={async (v) => { await onEditChapter?.(chapter.id, v); setEditingChapterId(null); }}
                    onCancel={() => setEditingChapterId(null)}
                  />
                ) : (
                  <button
                    onClick={() => {
                      setHoveredSectionId(null);
                      setActiveSectionId(activeSection.id);
                      setActiveChapterId(chapter.id);
                    }}
                    title={chapter.name}
                    className={`w-full text-left px-2.5 py-2.5 rounded-xl border transition-all duration-200 relative overflow-hidden
                      ${isActive
                        ? "bg-white/[0.07] border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : "bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10"
                      }`}
                  >
                    {isActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-zinc-300 rounded-r" />}

                    <div className="flex items-center gap-2">
                      {/* Collapsed: chapter number badge */}
                      <div className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold
                        ${isActive ? "bg-white/10 text-white" : "bg-white/5 text-zinc-500"}`}>
                        {cIdx + 1}
                      </div>
                      {/* Expanded content */}
                      <div className="flex-1 min-w-0 opacity-0 group-hover/ch:opacity-100 transition-opacity duration-200 overflow-hidden">
                        <p className={`text-[11px] font-semibold leading-snug truncate ${isActive ? "text-white" : "text-zinc-300"}`}>
                          {chapter.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-zinc-500 shrink-0">{chapter.topics?.length || 0}t</span>
                          {total > 0 && (
                            <>
                              <div className="flex-1 h-px bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-zinc-500/60"}`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-[9px] font-bold tabular-nums ${pct === 100 ? "text-emerald-400" : "text-zinc-600"}`}>{pct}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {canManage && (
                      <div className="absolute top-1 right-1 hidden group-hover/ch-item:flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); setEditingChapterId(chapter.id); }} className="p-0.5 rounded bg-black/60 text-zinc-500 hover:text-white">
                          <Edit2 size={9} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteChapter?.(chapter.id); }} className="p-0.5 rounded bg-black/60 text-zinc-500 hover:text-red-400">
                          <Trash2 size={9} />
                        </button>
                      </div>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin section manager assignment */}
        {isCreatorOrAdmin && activeSection && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1 mb-2">
              <Shield size={10} className="text-emerald-500/60" />
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Section Manager</span>
            </div>
            <MultiSearchableSelect
              options={knights.map((k: any) => ({
                value: k.id,
                label: [k.first_name, k.last_name].filter(Boolean).join(" ") || k.email || "Unknown",
                subLabel: k.email,
                image: k.profile_picture,
              }))}
              values={activeSection.managers?.map((m: any) => m.id) || []}
              onChange={(val) => onAssignManagers?.(activeSection.id, val)}
              placeholder="Assign managers…"
            />
          </div>
        )}
      </div>

      {/* ── PANEL 3: Topics ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto pl-1 scrollbar-thin">
        {/* Chapter header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-10 py-1 -mt-1">
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Atom size={10} /> Topics
            </div>
            {activeChapter && (
              <h3 className="text-base font-bold text-white mt-0.5 leading-tight">{activeChapter.name}</h3>
            )}
            {activeChapter?.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{activeChapter.description}</p>
            )}
          </div>
          {activeChapter && isSectionManager(activeSection) && (
            <button
              onClick={() => setAddingTopicTo(activeChapter.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 text-xs font-medium transition shrink-0"
            >
              <Plus size={13} /> Add Topic
            </button>
          )}
        </div>

        {/* Add topic form */}
        {addingTopicTo === activeChapter?.id && (
          <div className="mb-4">
            <InlineForm
              label="Topic"
              maxWords={20}
              initial={{ name: "", description: "", order: (topics.length || 0) + 1 }}
              onSave={async (v) => { await onAddTopic?.(activeChapter.id, v); setAddingTopicTo(null); }}
              onCancel={() => setAddingTopicTo(null)}
            />
          </div>
        )}

        {topics.length === 0 && !addingTopicTo && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-3">
              <Atom size={20} className="text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-500">No topics in this chapter yet.</p>
          </div>
        )}

        {/* Topic grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {topics.map((topic: any, tIdx: number) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              idx={tIdx}
              chapter={activeChapter}
              section={activeSection}
              data={data}
              user={user}
              mode={mode}
              isSectionManager={isSectionManager}
              onEditTopic={onEditTopic}
              onDeleteTopic={onDeleteTopic}
              onUploadNote={onUploadNote}
              onDeleteTest={onDeleteTest}
              dragProps={{}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
