"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { HierarchyService } from "@/services/hierarchy.service";
import { NotesService } from "@/services/notes.service";
import RichTextEditor from "@/components/ui/RichTextEditor";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/store/auth.store";

export default function EditNotePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuthStore();

  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  const [formData, setFormData] = useState({
    course_id: "",
    section_id: "",
    chapter_id: "",
    topic_id: "",
    title: "",
    content_html: "",
  });

  // Load hierarchy + existing note data in parallel
  useEffect(() => {
    const loadData = async () => {
      try {
        const [hierarchy, note] = await Promise.all([
          HierarchyService.getFullHierarchy(),
          NotesService.getById(id),
        ]);

        setTopics(hierarchy);

        // Pre-fill form with existing note data
        setFormData({
          course_id: note.topic?.chapter?.section?.course?.id || "",
          section_id: note.topic?.chapter?.section?.id || "",
          chapter_id: note.topic?.chapter?.id || "",
          topic_id: note.topic_id || "",
          title: note.title || "",
          content_html: note.content_html || "",
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load note");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await NotesService.updateNote(id, {
        title: formData.title,
        content_html: formData.content_html,
        topic_id: formData.topic_id,
      });
      setSuccess(true);
      // Redirect back after a short delay
      setTimeout(() => router.push("/intern/notes"), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <SectionTitle title="Edit Note" subtitle="Loading note data…" />
        <Panel className="mt-6 max-w-4xl">
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-white/5" />
            ))}
          </div>
        </Panel>
      </>
    );
  }

  return (
    <>
      <SectionTitle
        title="Edit Note"
        subtitle={`Editing: ${formData.title || id}`}
        action={
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            ← Back
          </button>
        }
      />

      <Panel className="mt-6 max-w-4xl">
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            ✅ Note saved! Redirecting…
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hierarchy dropdowns */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Course</label>
              <select
                value={formData.course_id}
                onChange={(e) =>
                  setFormData({ ...formData, course_id: e.target.value, section_id: "", chapter_id: "", topic_id: "" })
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/30 appearance-none"
              >
                <option value="">Select Course</option>
                {topics.map((c: any) => (
                  <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Section</label>
              <select
                value={formData.section_id}
                onChange={(e) =>
                  setFormData({ ...formData, section_id: e.target.value, chapter_id: "", topic_id: "" })
                }
                disabled={!formData.course_id}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/30 appearance-none disabled:opacity-40"
              >
                <option value="">Select Section</option>
                {topics
                  .find((c: any) => c.id === formData.course_id)
                  ?.sections?.filter((s: any) => {
                    const course = topics.find((c: any) => c.id === formData.course_id);
                    return user?.role === "ADMIN" || 
                           course?.created_by === user?.id || 
                           s.manager?.id === user?.id || 
                           (user?.assigned_teacher_id && user?.assigned_teacher_id === s.manager?.id) || 
                           (user?.assigned_teacher_id && user?.assigned_teacher_id === course?.created_by);
                  })
                  .map((s: any) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Chapter</label>
              <select
                value={formData.chapter_id}
                onChange={(e) =>
                  setFormData({ ...formData, chapter_id: e.target.value, topic_id: "" })
                }
                disabled={!formData.section_id}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/30 appearance-none disabled:opacity-40"
              >
                <option value="">Select Chapter</option>
                {topics
                  .find((c: any) => c.id === formData.course_id)
                  ?.sections?.find((s: any) => s.id === formData.section_id)
                  ?.chapters?.map((ch: any) => (
                    <option key={ch.id} value={ch.id} className="bg-zinc-900">{ch.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Topic</label>
              <select
                required
                value={formData.topic_id}
                onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                disabled={!formData.chapter_id}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/30 appearance-none disabled:opacity-40"
              >
                <option value="">Select Topic</option>
                {topics
                  .find((c: any) => c.id === formData.course_id)
                  ?.sections?.find((s: any) => s.id === formData.section_id)
                  ?.chapters?.find((ch: any) => ch.id === formData.chapter_id)
                  ?.topics?.map((t: any) => (
                    <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Note Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
              placeholder="e.g. Introduction to Newton's Laws"
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-zinc-300">Note Content</label>
              <ThemeToggle themeMode={themeMode} onChange={setThemeMode} />
            </div>
            <RichTextEditor
              value={formData.content_html}
              onChange={(val) => setFormData({ ...formData, content_html: val })}
              placeholder="Edit your note content here…"
              themeMode={themeMode}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={saving || success}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
