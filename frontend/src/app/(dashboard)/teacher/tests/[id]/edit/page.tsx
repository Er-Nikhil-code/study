"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { TestsService } from "@/services/tests.service";
import { QuestionsService } from "@/services/questions.service";
import { HierarchyService } from "@/services/hierarchy.service";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_minutes: 60,
    positive_marks: 4,
    negative_marks: 1,
    passing_marks: "" as number | "",
    start_time: "",
    end_time: "",
  });

  const [bankCourseId, setBankCourseId] = useState("");
  const [bankSectionId, setBankSectionId] = useState("");
  const [bankChapterId, setBankChapterId] = useState("");
  const [bankQuestionType, setBankQuestionType] = useState("");
  const [bankDifficulty, setBankDifficulty] = useState("");
  const [bankPyq, setBankPyq] = useState("ALL");
  const [bankYear, setBankYear] = useState("");

  useEffect(() => {
    HierarchyService.getFullHierarchy()
      .then(setHierarchy)
      .catch(err => console.error("Failed to load hierarchy", err));
  }, []);

  const allCourses = hierarchy;
  const allSections = hierarchy.flatMap(c => c.sections || []);
  const allChapters = allSections.flatMap((s: any) => s.chapters || []);
  const currentCourse = hierarchy.find(c => c.id === courseId);
  const currentSection = currentCourse?.sections?.find((s: any) => s.id === sectionId);
  const currentChapter = currentSection?.chapters?.find((c: any) => c.id === chapterId);
  const topicsList = currentChapter?.topics || [];

  // Load Test Details
  useEffect(() => {
    if (!testId || hierarchy.length === 0) return;
    
    TestsService.getById(testId).then((test) => {
      setFormData({
        title: test.title || "",
        description: test.description || "",
        duration_minutes: test.duration_minutes || 60,
        positive_marks: test.positive_marks || 4,
        negative_marks: test.negative_marks || 1,
        passing_marks: test.passing_marks ?? "",
        start_time: test.start_time ? new Date(test.start_time).toISOString().slice(0, 16) : "",
        end_time: test.end_time ? new Date(test.end_time).toISOString().slice(0, 16) : "",
      });

      if (test.topic_id) {
        setTopicId(test.topic_id);
        // Try to find course/section/chapter for this topic
        for (const c of hierarchy) {
          for (const s of c.sections || []) {
            for (const ch of s.chapters || []) {
              if (ch.topics?.some((t: any) => t.id === test.topic_id)) {
                setCourseId(c.id);
                setSectionId(s.id);
                setChapterId(ch.id);
                break;
              }
            }
          }
        }
      }

      TestsService.getPayload(testId).then((payload: any) => {
        if (payload?.test_questions) {
          const ids = payload.test_questions.map((tq: any) => tq.question_id);
          setSelectedQuestionIds(new Set(ids));
        }
      }).catch(e => console.error("Failed to load selected questions:", e));
      
      setInitialLoading(false);
    }).catch(err => {
      console.error(err);
      alert("Failed to load test details");
      router.back();
    });
  }, [testId, hierarchy, router]);

  useEffect(() => {
    const params: any = {};
    if (bankCourseId) params.course_id = bankCourseId;
    if (bankSectionId) params.section_id = bankSectionId;
    if (bankChapterId) params.chapter_id = bankChapterId;
    if (bankQuestionType) params.type = bankQuestionType;
    if (bankDifficulty) params.difficulty = bankDifficulty;
    if (bankPyq !== "ALL") params.is_pyq = bankPyq === "YES";
    if (bankYear) params.exam_year = bankYear;
    
    if (!bankCourseId && !bankSectionId && !bankChapterId && topicId) {
      params.topic_id = topicId;
    }

    QuestionsService.getAll(params).then((res) => {
      const approvedOnly = res.data.filter((q: any) => q.approval_status === "APPROVED");
      setQuestions(approvedOnly);
    });
  }, [topicId, bankCourseId, bankSectionId, bankChapterId, bankQuestionType, bankDifficulty, bankPyq, bankYear]);

  const toggleQuestion = (id: string) => {
    const newSet = new Set(selectedQuestionIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedQuestionIds(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) {
      alert("Please select a topic for the test.");
      return;
    }
    if (selectedQuestionIds.size === 0) {
      alert("Please select at least one question from the Question Bank.");
      return;
    }

    setLoading(true);
    try {
      await TestsService.update(testId, {
        ...formData,
        passing_marks: formData.passing_marks === "" ? null : formData.passing_marks,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : undefined,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
        total_marks: selectedQuestionIds.size * formData.positive_marks,
      });

      await TestsService.updateQuestions(testId, Array.from(selectedQuestionIds));
      
      queryClient.invalidateQueries({ queryKey: ["tests", "teacherList"] });
      router.back();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update test");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-12 text-center text-zinc-500">Loading test data...</div>;
  }

  return (
    <>
      <SectionTitle title={`Edit Test`} subtitle="Update test details and selected questions" />

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col lg:flex-row gap-6">
        {/* Left Col: Test Settings */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <Panel>
            <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Test Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-4 mb-6 pb-6 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Select Topic for Test</h3>
                <div className="grid gap-3">
                  <select value={courseId} onChange={e => { setCourseId(e.target.value); setSectionId(""); setChapterId(""); setTopicId(""); }} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500">
                    <option value="">Select Course...</option>
                    {hierarchy.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={sectionId} disabled={!courseId} onChange={e => { setSectionId(e.target.value); setChapterId(""); setTopicId(""); }} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500 disabled:opacity-50">
                    <option value="">Select Section...</option>
                    {currentCourse?.sections?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select value={chapterId} disabled={!sectionId} onChange={e => { setChapterId(e.target.value); setTopicId(""); }} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500 disabled:opacity-50">
                    <option value="">Select Chapter...</option>
                    {currentSection?.chapters?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select value={topicId} disabled={!chapterId} onChange={e => setTopicId(e.target.value)} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500 disabled:opacity-50">
                    <option value="">Select Topic...</option>
                    {topicsList.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-sm text-zinc-400 mb-1 truncate">Launch Date (Start)</label>
                  <input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500 min-w-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm text-zinc-400 mb-1 truncate">End Date</label>
                  <input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500 min-w-0" />
                </div>
              </div>

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
                  <input type="number" readOnly value={selectedQuestionIds.size * formData.positive_marks} className="w-full rounded bg-black/50 border border-white/5 px-3 py-2 text-zinc-500 outline-none cursor-not-allowed" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Marks per Question (+)</label>
                  <input type="number" required min="0" max="5" step="any" value={formData.positive_marks === 0 ? '' : formData.positive_marks} onChange={e => setFormData({...formData, positive_marks: e.target.value === '' ? 0 : Number(e.target.value)})} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-white outline-none focus:border-red-500" placeholder="0 to 5" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Negative Marks (-)</label>
                  <input type="number" required min="0" max="5" step="any" value={formData.negative_marks} onChange={e => setFormData({...formData, negative_marks: e.target.value === '' ? 0 : Number(e.target.value)})} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-white outline-none focus:border-red-500" placeholder="0 to 5" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Passing Marks</label>
                <input type="number" required min="0" value={formData.passing_marks} onChange={e => setFormData({...formData, passing_marks: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full rounded bg-black border border-white/10 px-3 py-2 text-white outline-none focus:border-red-500" placeholder="e.g. 40" />
              </div>

              <button type="submit" disabled={loading} className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Panel>
        </div>

        {/* Right Col: Question Bank Selection */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          <Panel className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Select Questions</h2>
              <span className="text-sm font-medium text-red-400">{selectedQuestionIds.size} Selected</span>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select value={bankCourseId} onChange={e => setBankCourseId(e.target.value)} className="rounded bg-black border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-red-500 min-w-[120px]">
                <option value="">All Courses</option>
                {allCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={bankSectionId} onChange={e => setBankSectionId(e.target.value)} className="rounded bg-black border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-red-500 min-w-[120px]">
                <option value="">All Sections</option>
                {allSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={bankChapterId} onChange={e => setBankChapterId(e.target.value)} className="rounded bg-black border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-red-500 min-w-[120px]">
                <option value="">All Chapters</option>
                {allChapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={bankQuestionType} onChange={e => setBankQuestionType(e.target.value)} className="rounded bg-black border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-red-500 min-w-[120px]">
                <option value="">All Types</option>
                <option value="SINGLE_CORRECT">Single Correct</option>
                <option value="MULTIPLE_CORRECT">Multi Correct</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="FILL_BLANK">Fill Blank</option>
                <option value="NUMERICAL">Numerical</option>
                <option value="ASSERTION_REASON">Assertion/Reason</option>
              </select>
              <select value={bankDifficulty} onChange={e => setBankDifficulty(e.target.value)} className="rounded bg-black border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-red-500 min-w-[120px]">
                <option value="">All Diff.</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
              <select value={bankPyq} onChange={e => setBankPyq(e.target.value)} className="rounded bg-black border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-red-500 min-w-[120px]">
                <option value="ALL">All PYQ Status</option>
                <option value="YES">Only PYQs</option>
                <option value="NO">Non-PYQs</option>
              </select>
              <input type="text" placeholder="Year (e.g. 2023)" value={bankYear} onChange={e => setBankYear(e.target.value)} className="rounded bg-black border border-white/10 px-2 py-1.5 text-xs text-white outline-none focus:border-red-500 w-24" />
            </div>
          </Panel>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {questions.length === 0 ? (
              <p className="text-zinc-500 p-4 border border-white/5 rounded">No questions found matching the selected filters.</p>
            ) : (
              [...questions].sort((a, b) => {
                const aSelected = selectedQuestionIds.has(a.id);
                const bSelected = selectedQuestionIds.has(b.id);
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
              }).map(q => (
                <div key={q.id} className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedQuestionIds.has(q.id) ? 'bg-red-900/20 border-red-500' : 'bg-zinc-900 border-white/5 hover:border-white/20'}`} onClick={() => toggleQuestion(q.id)}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <input type="checkbox" checked={selectedQuestionIds.has(q.id)} readOnly className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="mb-3 text-sm">
                        <ContentBlockRenderer blocks={q.content_json || []} />
                      </div>
                      
                      {q.options_json?.options && q.options_json.options.length > 0 && (
                        <div className="mb-4 space-y-1">
                          {q.options_json.options.map((opt: any) => (
                            <div key={opt.id} className="text-xs text-zinc-300 flex items-start bg-white/[0.02] border border-white/5 rounded p-2">
                              <span className="font-bold mr-2 text-zinc-500">{opt.id}.</span>
                              <span>{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-zinc-400">
                        <span className="bg-black/50 border border-white/10 px-2 py-1 rounded truncate max-w-[200px]">{q.topic?.name || "Unknown Topic"}</span>
                        <span className="bg-black/50 border border-white/10 px-2 py-1 rounded">{q.question_type.replace(/_/g, " ")}</span>
                        <span className="bg-black/50 border border-white/10 px-2 py-1 rounded">{q.difficulty}</span>
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
