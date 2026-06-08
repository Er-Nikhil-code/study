"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { QuestionsService } from "@/services/questions.service";
import authService from "@/services/auth.service";

const getNavItems = (role: string) => {
  if (role === "INTERN") {
    return [
      { label: "Intern Dashboard", href: "/dashboard" },
      { label: "Question Bank", href: "/teacher/questions" },
    ];
  }
  return [
    { label: "Teacher home", href: "/teacher" },
    { label: "Questions", href: "/teacher/questions" },
    { label: "Tests", href: "/teacher/tests" },
    { label: "Challenges", href: "/teacher/challenges" },
  ];
};

export default function CreateQuestionPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    topic_id: "",
    difficulty: "MEDIUM",
    marks: 4,
    negative_marks: 1,
    content: "",
    solution: "",
    options: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" }
    ],
    correct_option: "A"
  });

  useEffect(() => {
    const user = authService.getUser();
    if (user?.role) setRole(user.role);

    QuestionsService.getTopics()
      .then(setTopics)
      .catch((err) => {
        console.error("Failed to load topics:", err);
        setError("Failed to load topics for dropdown.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        topic_id: formData.topic_id,
        difficulty: formData.difficulty,
        marks: Number(formData.marks),
        negative_marks: Number(formData.negative_marks),
        type: "SINGLE_CORRECT",
        content_json: [{ type: "TEXT", content: formData.content }],
        options_json: { options: formData.options },
        answer_key: { correct_option: formData.correct_option },
        solution_json: formData.solution ? [{ type: "TEXT", content: formData.solution }] : []
      };

      await QuestionsService.create(payload);
      router.push("/teacher/questions");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to create question");
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...formData.options];
    newOptions[index].text = text;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <DashboardShell activeHref="/teacher/questions" navItems={getNavItems(role)}>
      <div className="flex items-center justify-between">
        <SectionTitle title="Create Question" subtitle="Add a new Single Correct MCQ" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-w-4xl">
        {error && (
          <div className="rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Panel className="space-y-5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">General Info</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
                placeholder="e.g. Newton's Second Law"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Topic</label>
              <select
                required
                value={formData.topic_id}
                onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 appearance-none"
              >
                <option value="">Select a topic...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                    {t.chapter?.subject?.name} → {t.chapter?.name} → {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 appearance-none"
              >
                <option value="EASY" className="bg-zinc-900">EASY</option>
                <option value="MEDIUM" className="bg-zinc-900">MEDIUM</option>
                <option value="HARD" className="bg-zinc-900">HARD</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Marks</label>
              <input
                type="number"
                min="1"
                required
                value={formData.marks}
                onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Negative Marks</label>
              <input
                type="number"
                min="0"
                required
                value={formData.negative_marks}
                onChange={(e) => setFormData({ ...formData, negative_marks: Number(e.target.value) })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
              />
            </div>
          </div>
        </Panel>

        <Panel className="space-y-5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Question Content</h2>
          <div>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none focus:border-red-500/30"
              placeholder="Write the question statement here..."
            />
          </div>
        </Panel>

        <Panel className="space-y-5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Options (Single Correct)</h2>
          <div className="space-y-3">
            {formData.options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-4">
                <input
                  type="radio"
                  name="correct_option"
                  value={opt.id}
                  checked={formData.correct_option === opt.id}
                  onChange={(e) => setFormData({ ...formData, correct_option: e.target.value })}
                  className="h-4 w-4 accent-red-500 cursor-pointer"
                />
                <span className="text-zinc-400 font-medium w-4">{opt.id}.</span>
                <input
                  type="text"
                  required
                  value={opt.text}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-red-500/30"
                  placeholder={`Option ${opt.id} text`}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="space-y-5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Solution (Optional)</h2>
          <div>
            <textarea
              rows={3}
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none focus:border-red-500/30"
              placeholder="Step by step explanation..."
            />
          </div>
        </Panel>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving || loading}
            className="rounded-xl bg-gradient-to-r from-red-600 to-rose-500 px-6 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] transition hover:from-red-500 hover:to-rose-400 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Question"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/teacher/questions")}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
