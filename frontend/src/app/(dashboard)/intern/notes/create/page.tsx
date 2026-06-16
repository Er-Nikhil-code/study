"use client";

import { useState, useEffect } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { HierarchyService } from "@/services/hierarchy.service";
import { NotesService } from "@/services/notes.service";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useAuthStore } from "@/store/auth.store";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function CreateNotePage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();
  const isPrivileged = user?.role === "ADMIN" || user?.role === "TEACHER";

  const [formData, setFormData] = useState({
    course_id: "",
    section_id: "",
    chapter_id: "",
    topic_id: "",
    title: "",
    content_html: ""
  });
  
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Extract hierarchy for cascaded dropdowns
    HierarchyService.getFullHierarchy().then((data: any) => {
      setTopics(data); // 'topics' holds full hierarchy here
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await NotesService.createNote(formData);
      setSuccess(true);
      setFormData({ course_id: "", section_id: "", chapter_id: "", topic_id: "", title: "", content_html: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit note");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: "Pawn home", href: "/intern" },
    { label: "Create Questions", href: "/intern/questions/create" },
    { label: "Create Notes", href: "/intern/notes/create" },
  ];

  return (
    <>
      <SectionTitle title="Create Educational Note" subtitle={isPrivileged ? "Create study material directly" : "Submit study material for Knight review"} />

      <Panel className="mt-6 max-w-4xl">
        {success && (
          <div className="mb-6 rounded bg-green-900/50 border border-green-500/50 p-4 text-green-400">
            {isPrivileged ? "Note created and published successfully!" : "Note submitted successfully! It is now pending knight review."}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded bg-red-900/50 border border-red-500/50 p-4 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">Course</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value, section_id: "", chapter_id: "", topic_id: "" })}
                className="w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-500 appearance-none"
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
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value, chapter_id: "", topic_id: "" })}
                disabled={!formData.course_id}
                className="w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-500 appearance-none disabled:opacity-50"
              >
                <option value="">Select Section</option>
                {topics
                  .find((c: any) => c.id === formData.course_id)
                  ?.sections?.filter((s: any) => {
                    const course = topics.find((c: any) => c.id === formData.course_id);
                    if (user?.role === "ADMIN") return true;
                    if (course?.created_by === user?.id) return true;
                    if (course?.staff?.some((st: any) => st.user?.id === user?.id || st.user_id === user?.id)) return true;
                    if (s.managers?.some((m: any) => m.id === user?.id)) return true;
                    const teacherId = user?.assigned_teacher_id || (user as any)?.assigned_teacher?.id;
                    if (teacherId) {
                      if (course?.created_by === teacherId) return true;
                      if (course?.staff?.some((st: any) => st.user?.id === teacherId || st.user_id === teacherId)) return true;
                      if (s.managers?.some((m: any) => m.id === teacherId)) return true;
                    }
                    return false;
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
                onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value, topic_id: "" })}
                disabled={!formData.section_id}
                className="w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-500 appearance-none disabled:opacity-50"
              >
                <option value="">Select Chapter</option>
                {topics.find((c: any) => c.id === formData.course_id)?.sections?.find((s: any) => s.id === formData.section_id)?.chapters?.map((ch: any) => (
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
                className="w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-red-500 appearance-none disabled:opacity-50"
              >
                <option value="">Select Topic</option>
                {topics.find((c: any) => c.id === formData.course_id)?.sections?.find((s: any) => s.id === formData.section_id)?.chapters?.find((ch: any) => ch.id === formData.chapter_id)?.topics?.map((t: any) => (
                  <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">Note Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-red-500"
              placeholder="e.g. Introduction to Newton's Laws"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-zinc-300">Note Content</label>
              <ThemeToggle themeMode={themeMode} onChange={setThemeMode} />
            </div>
            <RichTextEditor
              value={formData.content_html}
              onChange={(val) => setFormData({ ...formData, content_html: val })}
              placeholder="Write your note here using the formatting tools above..."
              themeMode={themeMode}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? (isPrivileged ? "Creating..." : "Submitting...") : (isPrivileged ? "Create Note" : "Submit for Review")}
          </button>
        </form>
      </Panel>
    </>
  );
}
