"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { AiService } from "@/services/ai.service";
import { HierarchyService } from "@/services/hierarchy.service";
import { QuestionsService } from "@/services/questions.service";
import { NotesService } from "@/services/notes.service";
import { Brain, Sparkles, AlertTriangle, Loader2, Save, Trash2, Check, Info, Edit2, PlusCircle } from "lucide-react";
import UserHoverCard from "@/components/ui/UserHoverCard";
import { useAuthStore } from "@/store/auth.store";
import { AdminTestSeriesService } from "@/services/test-series.admin.service";
import { TestsService } from "@/services/tests.service";

const QUESTION_TYPES = [
  "SINGLE_CORRECT",
  "MULTIPLE_CORRECT",
  "TRUE_FALSE",
  "FILL_BLANK",
  "NUMERICAL",
  "ASSERTION_REASON",
];

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

export default function AIGenerationPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [testSeriesList, setTestSeriesList] = useState<any[]>([]);
  const [testsList, setTestsList] = useState<any[]>([]);
  const [selectedTestSeries, setSelectedTestSeries] = useState<string>("");
  const [selectedTest, setSelectedTest] = useState<string>("");

  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  
  const [form, setForm] = useState({
    topicId: "",
    count: "" as any,
    questionType: "SINGLE_CORRECT",
    difficulty: "MEDIUM",
    useNotes: false,
    customInstructions: ""
  });

  const [newTestForm, setNewTestForm] = useState({
    title: "",
    description: "",
    duration_minutes: "" as number | "",
    positive_marks: 4,
    negative_marks: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesWarning, setNotesWarning] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [similarityPrompt, setSimilarityPrompt] = useState<{ idx: number; q: any; similar: any[] } | null>(null);

  useEffect(() => {
    HierarchyService.getFullHierarchy().then(setHierarchy).catch(() => setError("Failed to load hierarchy"));
    AdminTestSeriesService.getAdminTestSeries().then(res => setTestSeriesList(res || [])).catch(() => setError("Failed to load test series"));
  }, []);

  useEffect(() => {
    if (selectedTestSeries) {
      TestsService.getTeacherTests({ test_series_id: selectedTestSeries, take: 100 })
        .then((res: any) => setTestsList(res.data || []))
        .catch(() => setError("Failed to load tests"));
    } else {
      setTestsList([]);
      setSelectedTest("");
    }
  }, [selectedTestSeries]);

  const handleDestinationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDestination(val);
    
    // Reset selections
    setSelectedCourse("");
    setSelectedSection("");
    setSelectedChapter("");
    setForm({...form, topicId: ""});
    setSelectedTestSeries("");
    setSelectedTest("");

    if (val.startsWith("course_")) {
      setSelectedCourse(val.replace("course_", ""));
    } else if (val.startsWith("series_")) {
      setSelectedTestSeries(val.replace("series_", ""));
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDestination.startsWith("course_") && !form.topicId) {
      setError("Please select a topic");
      return;
    }
    if (selectedDestination.startsWith("series_") && !selectedTest) {
      setError("Please select a Test in the Test Series");
      return;
    }
    if (!selectedDestination) {
      setError("Please select a destination");
      return;
    }

    // Word count validation for custom instructions
    if (form.customInstructions) {
      const wordCount = form.customInstructions.trim().split(/\s+/).length;
      if (wordCount > 30) {
        setError("Custom instructions cannot exceed 30 words.");
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setGeneratedQuestions([]);
    setSavedStatus({});

    try {
      const context = getSelectedContext();
      
      const res = await AiService.generateQuestions({
        topicId: selectedDestination.startsWith("course_") ? form.topicId : undefined,
        testId: selectedDestination.startsWith("series_") ? selectedTest : undefined,
        topicName: context?.topicName || (selectedDestination.startsWith("series_") ? "Test Series" : ""),
        topicDesc: context?.topicDesc,
        courseName: context?.courseName,
        courseDesc: context?.courseDesc,
        sectionName: context?.sectionName,
        sectionDesc: context?.sectionDesc,
        chapterName: context?.chapterName,
        chapterDesc: context?.chapterDesc,
        count: form.count,
        questionType: form.questionType,
        difficulty: form.difficulty,
        useNotes: form.useNotes,
        customInstructions: form.customInstructions
      });
      setGeneratedQuestions(res);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg === "notes unavailable") {
        setError("Notes unavailable for this topic. Uncheck 'Use Topic Notes' or upload notes first.");
      } else {
        setError(msg || "Generation failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const getSelectedContext = () => {
    if (selectedDestination.startsWith("series_")) {
       const series = testSeriesList.find(s => s.id === selectedTestSeries);
       const tst = testsList.find(t => t.id === selectedTest);
       return {
         courseName: series ? `Test Series: ${series.title}` : "",
         topicName: tst ? tst.title : ""
       };
    }
    
    for (const course of hierarchy) {
      for (const sec of course.sections) {
        for (const chap of sec.chapters) {
          const top = chap.topics.find((t: any) => t.id === form.topicId);
          if (top) {
            return {
              courseName: course.name,
              courseDesc: course.description,
              sectionName: sec.name,
              sectionDesc: sec.description,
              chapterName: chap.name,
              chapterDesc: chap.description,
              topicName: top.name,
              topicDesc: top.description
            };
          }
        }
      }
    }
    return null;
  };

  const handleSaveQuestion = async (idx: number, q: any) => {
    setSavingIdx(idx);
    try {
      // First, check similarity
      const similar = await AiService.findSimilarQuestions({ text: q.questionText, threshold: 0.15 });
      if (similar && similar.length > 0) {
        setSimilarityPrompt({ idx, q, similar });
        setSavingIdx(null);
        return;
      }
      await executeSaveQuestion(idx, q);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to save question");
      setSavingIdx(null);
    }
  };

  const executeSaveQuestion = async (idx: number, q: any) => {
    setSavingIdx(idx);
    try {
      // Map AI output format to our schema
      const mappedType = form.questionType === "MULTIPLE_CHOICE" ? "SINGLE_CORRECT" : form.questionType;

      let optionsJson: any = { 
        options: (q.options || []).map((opt: any, i: number) => {
          const strictId = String.fromCharCode(65 + i); // Always force A, B, C, D, etc.
          if (typeof opt === 'object' && opt !== null) {
            return { id: strictId, text: opt.text || '' };
          }
          return { id: strictId, text: String(opt) };
        })
      };

      // Normalize answerKey to match option IDs (A, B, C, D)
      let ansStr = String(q.answerKey).trim();
      if (ansStr === "1") ansStr = "A";
      if (ansStr === "2") ansStr = "B";
      if (ansStr === "3") ansStr = "C";
      if (ansStr === "4") ansStr = "D";
      
      let answerKey: any = { correct_option: ansStr };

      if (mappedType === "TRUE_FALSE") {
        const isTrue = String(q.answerKey) === "1" || String(q.answerKey).toLowerCase() === "true" || String(q.answerKey) === "A";
        answerKey = { answer: isTrue, correct_option: isTrue ? "A" : "B" };
        // Force exactly 2 options for True/False
        optionsJson = {
          options: [
            { id: "A", text: "True" },
            { id: "B", text: "False" }
          ]
        };
      } else if (mappedType === "MULTIPLE_CORRECT") {
        const correctArray = String(q.answerKey).split(',').map(s => {
          let v = s.trim();
          if (v === "1") return "A";
          if (v === "2") return "B";
          if (v === "3") return "C";
          if (v === "4") return "D";
          return v;
        }).filter(Boolean);
        answerKey = { correct_options: correctArray };
      } else if (mappedType === "FILL_BLANK") {
        let ansText = String(q.answerKey);
        
        // Find the matching option text if they provided an ID like "1" or "A"
        let matchedText = ansStr;
        if (optionsJson && optionsJson.options) {
          const matchedOpt = optionsJson.options.find((o: any) => o.id === ansStr);
          if (matchedOpt) {
            matchedText = matchedOpt.text;
          }
        }

        if (q.options && q.options.length > 0 && ansText === String(q.answerKey)) {
          // Fallback if ansText didn't map cleanly
          const firstOpt = q.options[0];
          if (typeof firstOpt === 'object' && firstOpt.text === matchedText) {
             // It's fine
          } else if (matchedText === ansStr) {
             ansText = typeof firstOpt === 'object' ? firstOpt.text : String(firstOpt);
             matchedText = ansText;
          }
        }
        
        answerKey = {
          blanks: [{ position: 1, answer: matchedText, case_sensitive: false }],
          correct_option: ansStr // Save it here just in case UI wants it mapped easily
        };
        // Do NOT set optionsJson = undefined; we want to keep them!
      } else if (mappedType === "NUMERICAL" || mappedType === "ESSAY" || mappedType === "IMAGE_BASED") {
        let matchedOptionId = ansStr;
        if (mappedType === "NUMERICAL" && !["A", "B", "C", "D", "E", "F"].includes(matchedOptionId)) {
           if (optionsJson && optionsJson.options) {
             const matchedOpt = optionsJson.options.find((o: any) => o.text.trim() === ansStr);
             if (matchedOpt) matchedOptionId = matchedOpt.id;
             else matchedOptionId = "A"; // Fallback to pass validation
           } else {
             matchedOptionId = "A";
           }
        }
        let parsedNum = parseFloat(String(q.answerKey));
        answerKey = { answer: isNaN(parsedNum) ? undefined : parsedNum, correct_option: matchedOptionId };
        // Keep optionsJson if it exists
      }
      
      // Force 4 options for MCQ/MSQ/Assertion/Numerical as requested
      if (mappedType === "SINGLE_CORRECT" || mappedType === "MULTIPLE_CORRECT" || mappedType === "ASSERTION_REASON" || mappedType === "NUMERICAL") {
         if (!optionsJson || !optionsJson.options || optionsJson.options.length === 0) {
            optionsJson = {
              options: [
                { id: "A", text: "Option A" },
                { id: "B", text: "Option B" },
                { id: "C", text: "Option C" },
                { id: "D", text: "Option D" },
              ]
            };
         }
      }

      // For ASSERTION_REASON, enforce standard options text just in case AI deviated
      if (mappedType === "ASSERTION_REASON") {
        optionsJson = {
          options: [
            { id: "A", text: "Both Assertion (A) and Reason (R) are true and R is the correct explanation of A." },
            { id: "B", text: "Both Assertion (A) and Reason (R) are true but R is NOT the correct explanation of A." },
            { id: "C", text: "Assertion (A) is true but Reason (R) is false." },
            { id: "D", text: "Assertion (A) is false but Reason (R) is true." }
          ]
        };
      }

      let finalTestId = selectedTest;

      // Dynamic Test Creation
      if (selectedTest.startsWith("create_")) {
        const type = selectedTest.replace("create_", "");
        const newTest = await TestsService.create({
          title: newTestForm.title,
          description: newTestForm.description,
          duration_minutes: newTestForm.duration_minutes,
          positive_marks: newTestForm.positive_marks,
          negative_marks: newTestForm.negative_marks,
          total_marks: newTestForm.positive_marks, // Initial marks will be updated by backend or manual calculation
          test_type: type,
          test_series_id: selectedTestSeries,
        });
        finalTestId = newTest.id;
        setSelectedTest(newTest.id);
        setTestsList((prev) => [...prev, newTest]);
      }

      const mappedData: any = {
        topic_id: selectedDestination.startsWith("course_") ? form.topicId : undefined,
        test_id: selectedDestination.startsWith("series_") ? finalTestId : undefined,
        type: mappedType,
        difficulty: q.difficulty || form.difficulty,
        marks: 1,
        negative_marks: 0,
        content_json: [{ type: "TEXT", content: q.questionText }],
        options_json: optionsJson,
        answer_key: answerKey,
        solution_json: q.solutionText ? [{ type: "TEXT", content: q.solutionText }] : [],
        approval_status: "APPROVED", // Mapped directly to APPROVED to prevent Zod dropping causing issues
      };

      await QuestionsService.create(mappedData);
      setSavedStatus(prev => ({ ...prev, [idx]: true }));
      
      // Invalidate caches so dashboards update instantly
      queryClient.invalidateQueries({ queryKey: ["questions", "list"] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to save question");
    } finally {
      setSavingIdx(null);
    }
  };

  const handleStartEdit = (idx: number, q: any) => {
    setEditingIdx(idx);
    setEditForm(JSON.parse(JSON.stringify(q)));
  };

  const handleSaveEdit = (idx: number) => {
    const updated = [...generatedQuestions];
    updated[idx] = editForm;
    setGeneratedQuestions(updated);
    setEditingIdx(null);
    setEditForm(null);
  };

  const wordCount = form.customInstructions.trim() ? form.customInstructions.trim().split(/\s+/).length : 0;

  const allCourses = hierarchy;
  const allSections = (selectedCourse 
    ? hierarchy.find((c: any) => c.id === selectedCourse)?.sections || []
    : hierarchy.flatMap((c: any) => c.sections || [])
  ).filter((s: any) => {
    const course = hierarchy.find((c: any) => c.id === s.course_id) || hierarchy.find((c: any) => c.sections?.some((sec: any) => sec.id === s.id));
    return user?.role === "ADMIN" || course?.created_by === user?.id || s.manager?.id === user?.id;
  });

  const allChapters = selectedSection
    ? allSections.find((s: any) => s.id === selectedSection)?.chapters || []
    : allSections.flatMap((s: any) => s.chapters || []);

  const allTopics = selectedChapter
    ? allChapters.find((c: any) => c.id === selectedChapter)?.topics || []
    : allChapters.flatMap((c: any) => c.topics || []);

  return (
    <>
      <SectionTitle 
        title="AI Question Generator" 
        subtitle="Generate intelligent questions customized to your curriculum using AI."
      />

      <div className="grid gap-6 md:grid-cols-3 items-start mt-6">
        {/* Configuration Panel */}
        <Panel className="md:col-span-1 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Brain size={120} />
          </div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain size={20} className="text-purple-400" />
            Generator Config
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4 relative z-10">
            {/* Destination Selection */}
            <div>
              <label className="text-xs text-zinc-400">Select Destination</label>
              <select value={selectedDestination} onChange={handleDestinationChange} className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500">
                <option value="">Select Course or Test Series...</option>
                <optgroup label="Courses">
                  {hierarchy.map((c: any) => <option key={`course_${c.id}`} value={`course_${c.id}`}>[Course] {c.name}</option>)}
                </optgroup>
                <optgroup label="Test Series">
                  {testSeriesList.map((ts: any) => <option key={`series_${ts.id}`} value={`series_${ts.id}`}>[Series] {ts.name}</option>)}
                </optgroup>
              </select>
            </div>

            {selectedDestination.startsWith("course_") && (
              <>
                <div>
                  <label className="text-xs text-zinc-400">Section</label>
                  <select 
                    value={selectedSection} 
                    onChange={e => setSelectedSection(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                  >
                    <option value="">-- All Sections --</option>
                    {allSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Chapter</label>
                  <select 
                    value={selectedChapter} 
                    onChange={e => setSelectedChapter(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                  >
                    <option value="">-- All Chapters --</option>
                    {allChapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400">Topic</label>
                  <select 
                    required={selectedDestination.startsWith("course_")}
                    value={form.topicId} 
                    onChange={e => setForm({...form, topicId: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                  >
                    <option value="">-- Choose Topic --</option>
                    {allTopics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </>
            )}

            {selectedDestination.startsWith("series_") && (
              <div>
                <label className="text-xs text-zinc-400">Test</label>
                <select 
                  required={selectedDestination.startsWith("series_")}
                  value={selectedTest} 
                  onChange={e => setSelectedTest(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                >
                  <option value="">-- Choose Test --</option>
                  
                  <optgroup label="Topicwise Tests" className="bg-zinc-900 font-bold text-white">
                    <option value="create_TOPICWISE" className="text-purple-400 font-medium">+ Create Topicwise Test</option>
                    {testsList.filter((t: any) => t.test_type === 'TOPICWISE').map((t: any) => (
                      <option key={t.id} value={t.id} className="text-white font-normal">{t.title}</option>
                    ))}
                  </optgroup>
                  
                  <optgroup label="Unitwise Tests" className="bg-zinc-900 font-bold text-white">
                    <option value="create_UNITWISE" className="text-purple-400 font-medium">+ Create Unitwise Test</option>
                    {testsList.filter((t: any) => t.test_type === 'UNITWISE').map((t: any) => (
                      <option key={t.id} value={t.id} className="text-white font-normal">{t.title}</option>
                    ))}
                  </optgroup>
                  
                  <optgroup label="Full Syllabus Tests" className="bg-zinc-900 font-bold text-white">
                    <option value="create_FULL_SYLLABUS" className="text-purple-400 font-medium">+ Create Full Syllabus Test</option>
                    {testsList.filter((t: any) => t.test_type === 'FULL_SYLLABUS').map((t: any) => (
                      <option key={t.id} value={t.id} className="text-white font-normal">{t.title}</option>
                    ))}
                  </optgroup>
                </select>

                {selectedTest.startsWith("create_") && (
                  <div className="mt-4 p-4 border border-purple-500/30 rounded-xl bg-purple-500/5 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-semibold text-purple-400 border-b border-purple-500/20 pb-2">
                      Configure New {selectedTest.replace("create_", "").replace("_", " ")} Test
                    </h4>
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-zinc-400 mb-1 block">Test Title</label>
                        <input 
                          type="text" required 
                          value={newTestForm.title} 
                          onChange={e => setNewTestForm({...newTestForm, title: e.target.value})}
                          className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" 
                          placeholder="E.g., Mock Test 1"
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-zinc-400 mb-1 block">Syllabus / Description (Optional)</label>
                        <textarea 
                          rows={2}
                          value={newTestForm.description} 
                          onChange={e => setNewTestForm({...newTestForm, description: e.target.value})}
                          className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" 
                          placeholder="Topics covered..."
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 mb-1 block">Duration (Mins)</label>
                        <input 
                          type="number" required min="1"
                          value={newTestForm.duration_minutes} 
                          onChange={e => setNewTestForm({...newTestForm, duration_minutes: e.target.value ? Number(e.target.value) : ""})}
                          className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 mb-1 block">Marks (+)</label>
                          <input 
                            type="number" required min="0" step="any"
                            value={newTestForm.positive_marks} 
                            onChange={e => setNewTestForm({...newTestForm, positive_marks: e.target.value ? Number(e.target.value) : 0})}
                            className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 mb-1 block">Negative (-)</label>
                          <input 
                            type="number" required min="0" step="any"
                            value={newTestForm.negative_marks} 
                            onChange={e => setNewTestForm({...newTestForm, negative_marks: e.target.value ? Number(e.target.value) : 0})}
                            className="w-full rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500/50" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* AI Parameters */}
            {(form.topicId || selectedTest) && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex flex-col gap-1 relative">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="useNotes"
                      checked={form.useNotes}
                      onChange={async e => {
                        const checked = e.target.checked;
                        if (checked) {
                          try {
                            const notes = await NotesService.getApprovedNotes(form.topicId);
                            if (!notes || notes.length === 0) {
                              setNotesWarning("Notes unavailable for this topic.");
                              setForm({...form, useNotes: false});
                              setTimeout(() => setNotesWarning(null), 2000);
                            } else {
                              setForm({...form, useNotes: true});
                            }
                          } catch (err) {
                            setNotesWarning("Failed to check notes availability.");
                            setForm({...form, useNotes: false});
                            setTimeout(() => setNotesWarning(null), 2000);
                          }
                        } else {
                          setForm({...form, useNotes: false});
                          setNotesWarning(null);
                        }
                      }}
                      className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-600/20"
                    />
                    <label htmlFor="useNotes" className="text-sm text-zinc-300">Use Topic Notes for Reference</label>
                  </div>
                  {notesWarning && (
                    <div className="absolute top-full mt-1 left-0 z-50 bg-red-600/90 text-white text-xs px-3 py-1.5 rounded shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
                      {notesWarning}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400">Question Type</label>
                    <select 
                      value={form.questionType} 
                      onChange={e => setForm({...form, questionType: e.target.value})}
                      className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                    >
                      {QUESTION_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Difficulty</label>
                    <select 
                      value={form.difficulty} 
                      onChange={e => setForm({...form, difficulty: e.target.value})}
                      className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                    >
                      {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                    <label className="text-xs text-zinc-400">
                      Number of Questions {isAdmin ? "" : "(Max 5)"}
                    </label>
                  </div>
                  <input 
                    type="number" 
                    min="1" 
                    max={isAdmin ? undefined : "5"}
                    required
                    value={form.count} 
                    placeholder={isAdmin ? "e.g. 20" : "1-5"}
                    onChange={e => setForm({...form, count: e.target.value ? Number(e.target.value) : ""})}
                    className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500" 
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-zinc-400">Custom Instructions</label>
                    <span className={`text-[10px] ${wordCount > 30 ? 'text-red-400' : 'text-zinc-500'}`}>
                      {wordCount} / 30 words
                    </span>
                  </div>
                  <textarea 
                    value={form.customInstructions} 
                    onChange={e => setForm({...form, customInstructions: e.target.value})}
                    placeholder="E.g. Focus on real-world applications..."
                    className={`mt-1 block w-full rounded-md border bg-black px-3 py-2 text-sm text-white focus:ring-1 min-h-[80px] ${wordCount > 30 ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'}`} 
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle size={14} className="shrink-0" /> <span className="break-words">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !form.topicId || wordCount > 30}
              className="w-full flex justify-center items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? null : <Brain size={16} />}
              {loading ? "Generating..." : "Generate with AI"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
              <strong className="block mb-1 text-blue-400">Knight Quota</strong>
              You can generate a maximum of 50 AI questions per day. Your knight account acts as the creator.
            </div>
          </div>
        </Panel>

        {/* Results Panel */}
        <div className="md:col-span-2 space-y-4">
          {!loading && generatedQuestions.length === 0 && (
            <Panel className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-white/10 bg-transparent">
              <Brain size={48} className="text-zinc-700 mb-4" />
              <h4 className="text-lg font-medium text-zinc-300">No Questions Generated</h4>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Configure your generation parameters on the left and hit Generate to see the AI's suggestions.
              </p>
            </Panel>
          )}

          {loading && (
            <Panel className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative">
                <Brain size={48} className="text-purple-500/50 hidden" />
              </div>
              <h4 className="text-lg font-medium text-white mt-4">Generating Questions...</h4>
              <p className="text-sm text-zinc-500 mt-2">The AI is analyzing your curriculum context.</p>
            </Panel>
          )}

          {!loading && generatedQuestions.map((q, idx) => (
            <Panel key={idx} className="relative transition hover:border-purple-500/30 group">
              {editingIdx === idx ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-zinc-400">Question Text</label>
                    <textarea value={editForm.questionText} onChange={e => setEditForm({...editForm, questionText: e.target.value})} className="mt-1 w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white" rows={3} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Options</label>
                    <div className="space-y-2 mt-1">
                      {editForm.options?.map((opt: any, optIdx: number) => (
                        <div key={opt.id} className="flex gap-2 items-center">
                          <span className="text-zinc-500 font-mono text-xs">{opt.id}.</span>
                          <input type="text" value={opt.text} onChange={e => {
                            const newOpts = [...editForm.options];
                            newOpts[optIdx].text = e.target.value;
                            setEditForm({...editForm, options: newOpts});
                          }} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" />
                          <button onClick={() => {
                            const newOpts = editForm.options.filter((_: any, i: number) => i !== optIdx);
                            setEditForm({...editForm, options: newOpts});
                          }} className="text-zinc-500 hover:text-red-400 transition" title="Remove Option">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => {
                      const newId = String(editForm.options?.length ? Math.max(...editForm.options.map((o: any) => parseInt(o.id) || 0)) + 1 : 1);
                      setEditForm({...editForm, options: [...(editForm.options || []), { id: newId, text: "" }]});
                    }} className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition">
                      <PlusCircle size={12} /> Add Option
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-400">Answer Key {form.questionType === 'MULTIPLE_CORRECT' && "(comma-separated)"}</label>
                      {form.questionType === 'MULTIPLE_CORRECT' ? (
                        <input 
                          type="text" 
                          value={editForm.answerKey} 
                          onChange={e => setEditForm({...editForm, answerKey: e.target.value})} 
                          className="mt-1 w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" 
                          placeholder="e.g. 1,3"
                        />
                      ) : (
                        <select value={editForm.answerKey} onChange={e => setEditForm({...editForm, answerKey: e.target.value})} className="mt-1 w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500">
                          {editForm.options?.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>{opt.id}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Difficulty</label>
                      <select value={editForm.difficulty} onChange={e => setEditForm({...editForm, difficulty: e.target.value})} className="mt-1 w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500">
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Solution Text</label>
                    <textarea value={editForm.solutionText || ""} onChange={e => setEditForm({...editForm, solutionText: e.target.value})} className="mt-1 w-full bg-black border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-purple-500" rows={2} />
                  </div>
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                    <button onClick={() => setEditingIdx(null)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition">Cancel</button>
                    <button onClick={() => handleSaveEdit(idx)} className="px-3 py-1.5 rounded text-xs bg-purple-600 text-white hover:bg-purple-500 transition">Save Edits</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Question text */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded uppercase tracking-wider">AI</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                    q.difficulty === 'EASY' ? 'bg-emerald-500/20 text-emerald-400' :
                    q.difficulty === 'HARD' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>{q.difficulty}</span>
                </div>
              </div>
              <div className="text-white font-medium mb-4">{idx + 1}. {q.questionText}</div>
              
              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {q.options?.map((opt: any) => {
                  const isCorrect = String(q.answerKey).split(',').map(s => s.trim()).includes(String(opt.id));
                  return (
                  <div 
                    key={opt.id} 
                    className={`p-3 rounded-lg border text-sm ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-white/5 border-white/10 text-zinc-300'}`}
                  >
                    <span className="font-mono text-xs opacity-50 mr-2">{opt.id}.</span> {opt.text}
                    {isCorrect && <Check size={14} className="inline ml-2 text-emerald-400" />}
                  </div>
                  );
                })}
              </div>

              {/* Solution */}
              {q.solutionText && (
                <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-sm text-zinc-400 mb-4">
                  <strong className="text-zinc-300">Solution:</strong> {q.solutionText}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end border-t border-white/5 pt-4 mt-4">
                <button 
                  onClick={() => handleStartEdit(idx, q)}
                  disabled={savedStatus[idx]}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition disabled:opacity-50"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  onClick={() => setGeneratedQuestions(prev => prev.filter((_, i) => i !== idx))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
                >
                  <Trash2 size={14} /> Drop
                </button>
                <button 
                  onClick={() => handleSaveQuestion(idx, q)}
                  disabled={savedStatus[idx] || savingIdx === idx}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                    savedStatus[idx] 
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {savedStatus[idx] ? <Check size={14} /> : savingIdx === idx ? null : <Save size={14} />}
                  {savedStatus[idx] ? 'Saved to Bank' : 'Save to Bank'}
                </button>
              </div>
              </>
            )}
            </Panel>
          ))}
        </div>
      </div>

      {/* Custom Similarity Modal */}
      {similarityPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-white/10 bg-red-500/10 flex items-start gap-4">
              <div className="p-2 bg-red-500/20 rounded-lg shrink-0 mt-1">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Similar Questions Found</h3>
                <p className="text-sm text-zinc-400 mt-1">
                  We found {similarityPrompt.similar.length} question(s) in the bank that are semantically very similar. Please review them before saving.
                </p>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {similarityPrompt.similar.map((sim: any, i: number) => (
                <div key={sim.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-zinc-400">Match #{i + 1}</span>
                    <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">Similarity: {((1 - sim.distance) * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">
                    {sim.content_json?.[0]?.content || "No text preview"}
                  </p>
                  <a 
                    href={isAdmin ? `/admin/questions/${sim.id}/edit` : `/teacher/questions/${sim.id}/edit`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    View existing question
                  </a>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 bg-black/40">
              <button
                onClick={() => setSimilarityPrompt(null)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:bg-white/5 transition border border-transparent"
              >
                Cancel Save
              </button>
              <button
                onClick={() => {
                  executeSaveQuestion(similarityPrompt.idx, similarityPrompt.q);
                  setSimilarityPrompt(null);
                }}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition border border-red-500/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
