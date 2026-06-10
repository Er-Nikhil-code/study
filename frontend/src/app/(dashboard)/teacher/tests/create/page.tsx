"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { TestsService } from "@/services/tests.service";
import { QuestionsService } from "@/services/questions.service";

export default function CreateTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic_id");
  const topicName = searchParams.get("topic_name");
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!topicId) {
      alert("No topic selected. Please start from the Course Curriculum to create a test.");
      router.push("/teacher/tests");
    }
  }, [topicId, router]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_minutes: 60,
    total_marks: 100,
    passing_marks: 40,
  });

  useEffect(() => {
    // Fetch ONLY APPROVED questions for the test bank
    QuestionsService.getAll().then((res) => {
      const approvedOnly = res.data.filter((q: any) => q.approval_status === "APPROVED");
      setQuestions(approvedOnly);
    });
  }, []);

  const toggleQuestion = (id: string) => {
    const newSet = new Set(selectedQuestionIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedQuestionIds(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.size === 0) {
      alert("Please select at least one question from the Question Bank.");
      return;
    }

    setLoading(true);
    try {
      await TestsService.create({
        ...formData,
        topic_id: topicId as string,
        question_ids: Array.from(selectedQuestionIds),
      });
      router.back();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create test");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { label: "Teacher home", href: "/teacher" },
    { label: "Questions", href: "/teacher/questions" },
    { label: "Tests", href: "/teacher/tests" },
  ];

  return (
    <>
      <SectionTitle title={`Create New Test ${topicName ? `for: ${topicName}` : ""}`} subtitle="Configure test rules and select questions from the approved bank" />

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col lg:flex-row gap-6">
        {/* Left Col: Test Settings */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <Panel>
            <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Test Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Test Title</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-white outline-none focus:border-red-500" placeholder="Test title" />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description (Optional)</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-white outline-none focus:border-red-500" placeholder="Test instructions" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Duration (mins)</label>
                  <input type="number" required min="1" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-white outline-none focus:border-red-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Total Marks</label>
                  <input type="number" required min="1" value={formData.total_marks} onChange={e => setFormData({...formData, total_marks: Number(e.target.value)})} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-white outline-none focus:border-red-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Passing Marks</label>
                <input type="number" required min="0" value={formData.passing_marks} onChange={e => setFormData({...formData, passing_marks: Number(e.target.value)})} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-white outline-none focus:border-red-500" />
              </div>

              <button type="submit" disabled={loading} className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">
                {loading ? "Creating..." : "Create Draft Test"}
              </button>
            </div>
          </Panel>
        </div>

        {/* Right Col: Question Bank Selection */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          <Panel className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Select Questions</h2>
            <span className="text-sm font-medium text-red-400">{selectedQuestionIds.size} Selected</span>
          </Panel>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {questions.length === 0 ? (
              <p className="text-zinc-500 p-4 border border-white/5 rounded">No approved questions found in the Question Bank. Only APPROVED questions can be added to tests.</p>
            ) : (
              questions.map(q => (
                <div key={q.id} className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedQuestionIds.has(q.id) ? 'bg-red-900/20 border-red-500' : 'bg-zinc-900 border-white/5 hover:border-white/20'}`} onClick={() => toggleQuestion(q.id)}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <input type="checkbox" checked={selectedQuestionIds.has(q.id)} readOnly className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{q.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-zinc-400">
                        <span className="bg-black px-2 py-1 rounded">Type: {q.question_type}</span>
                        <span className="bg-black px-2 py-1 rounded">Marks: {q.marks}</span>
                        <span className="bg-black px-2 py-1 rounded text-red-400">Neg: {q.negative_marks}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </form>
    </>
  );
}
