"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { HierarchyService } from "@/services/hierarchy.service";
import { NotesService } from "@/services/notes.service";

export default function CreateNotePage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    topic_id: "",
    title: "",
    content_html: ""
  });

  useEffect(() => {
    // Extract topics from hierarchy
    HierarchyService.getFullHierarchy().then((courses: any) => {
      const allTopics: any[] = [];
      courses.forEach((c: any) => {
        c.sections?.forEach((s: any) => {
          s.chapters?.forEach((ch: any) => {
            ch.topics?.forEach((t: any) => {
              allTopics.push({
                ...t,
                chapter: { ...ch, section: { ...s, course: c } }
              });
            });
          });
        });
      });
      setTopics(allTopics);
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
      setFormData({ topic_id: "", title: "", content_html: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit note");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: "Intern home", href: "/intern" },
    { label: "Create Questions", href: "/intern/questions/create" },
    { label: "Create Notes", href: "/intern/notes/create" },
  ];

  return (
    <DashboardShell activeHref="/intern/notes/create">
      <SectionTitle title="Create Educational Note" subtitle="Submit study material for Teacher review" />

      <Panel className="mt-6 max-w-4xl">
        {success && (
          <div className="mb-6 rounded bg-green-900/50 border border-green-500/50 p-4 text-green-400">
            Note submitted successfully! It is now pending teacher review.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded bg-red-900/50 border border-red-500/50 p-4 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300">Target Topic</label>
            <select
              required
              value={formData.topic_id}
              onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-red-500"
            >
              <option value="">Select a topic...</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id} className="bg-zinc-900">
                  {t.chapter.section.course.name} → {t.chapter.section.name} → {t.chapter.name} → {t.name}
                </option>
              ))}
            </select>
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
            <label className="block text-sm font-medium text-zinc-300 mb-2">Content (HTML format supported)</label>
            <textarea
              required
              rows={15}
              value={formData.content_html}
              onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
              className="block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-sm"
              placeholder="<h1>Main Heading</h1>\n<p>Start writing the content...</p>"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </button>
        </form>
      </Panel>
    </DashboardShell>
  );
}
