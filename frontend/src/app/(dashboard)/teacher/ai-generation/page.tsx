"use client";

import { useState, useEffect } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { AiService } from "@/services/ai.service";
import { HierarchyService } from "@/services/hierarchy.service";
import { QuestionsService } from "@/services/questions.service";
import { Brain, Save, Check, AlertTriangle, Loader2, Edit2, Trash2 } from "lucide-react";
import UserHoverCard from "@/components/ui/UserHoverCard";

const QUESTION_TYPES = [
  "SINGLE_CORRECT",
  "MULTIPLE_CORRECT",
  "TRUE_FALSE",
  "FILL_BLANK",
  "MATCHING",
  "PASSAGE",
  "NUMERICAL",
  "ESSAY",
  "IMAGE_BASED",
];

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

export default function AIGenerationPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cascading Selection State
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");

  const [form, setForm] = useState({
    topicId: "",
    count: 5,
    questionType: "SINGLE_CORRECT",
    difficulty: "MEDIUM",
    useNotes: false,
    customInstructions: "",
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    HierarchyService.getFullHierarchy().then(setHierarchy).catch(() => setError("Failed to load hierarchy"));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topicId) {
      setError("Please select a topic");
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
      const selectedTopicName = getSelectedTopicName();
      
      const res = await AiService.generateQuestions({
        topicId: form.topicId,
        topicName: selectedTopicName,
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

  const getSelectedTopicName = () => {
    for (const course of hierarchy) {
      for (const sec of course.sections) {
        for (const chap of sec.chapters) {
          const top = chap.topics.find((t: any) => t.id === form.topicId);
          if (top) return top.name;
        }
      }
    }
    return "";
  };

  const handleSaveQuestion = async (idx: number, q: any) => {
    setSavingIdx(idx);
    try {
      // First, check similarity
      const similar = await AiService.findSimilarQuestions({ text: q.questionText, threshold: 0.15 });
      if (similar && similar.length > 0) {
        const confirmSave = confirm(`Warning: We found ${similar.length} similar question(s) in the bank. Do you still want to save this new question?`);
        if (!confirmSave) {
          setSavingIdx(null);
          return;
        }
      }

      // Map AI output format to our schema
      const mappedData = {
        topic_id: form.topicId,
        type: form.questionType,
        difficulty: q.difficulty || form.difficulty,
        marks: 1,
        negative_marks: 0,
        content_json: [{ type: "TEXT", content: q.questionText }],
        options_json: q.options || [],
        answer_key: { correct_option_id: q.answerKey },
        solution_json: q.solutionText ? [{ type: "TEXT", content: q.solutionText }] : [],
        approval_status: "AI_GENERATED", // The tag is handled by this status!
      };

      await QuestionsService.create(mappedData);
      setSavedStatus(prev => ({ ...prev, [idx]: true }));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save question");
    } finally {
      setSavingIdx(null);
    }
  };

  const wordCount = form.customInstructions.trim() ? form.customInstructions.trim().split(/\s+/).length : 0;

  // Cascading lists
  const currentCourse = hierarchy.find(c => c.id === selectedCourse);
  const currentSection = currentCourse?.sections.find((s: any) => s.id === selectedSection);
  const currentChapter = currentSection?.chapters.find((c: any) => c.id === selectedChapter);
  const topicsList = currentChapter?.topics || [];

  return (
    <>
      <SectionTitle 
        title="AI Question Generator" 
        subtitle="Generate intelligent questions customized to your curriculum using Gemini 2.5 Flash."
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
            {/* Cascading Selects */}
            <div>
              <label className="text-xs text-zinc-400">Course</label>
              <select 
                required
                value={selectedCourse} 
                onChange={e => {
                  setSelectedCourse(e.target.value);
                  setSelectedSection("");
                  setSelectedChapter("");
                  setForm({...form, topicId: ""});
                }}
                className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
              >
                <option value="">-- Choose Course --</option>
                {hierarchy.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </select>
            </div>

            {selectedCourse && (
              <div>
                <label className="text-xs text-zinc-400">Section</label>
                <select 
                  required
                  value={selectedSection} 
                  onChange={e => {
                    setSelectedSection(e.target.value);
                    setSelectedChapter("");
                    setForm({...form, topicId: ""});
                  }}
                  className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                >
                  <option value="">-- Choose Section --</option>
                  {currentCourse?.sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {selectedSection && (
              <div>
                <label className="text-xs text-zinc-400">Chapter</label>
                <select 
                  required
                  value={selectedChapter} 
                  onChange={e => {
                    setSelectedChapter(e.target.value);
                    setForm({...form, topicId: ""});
                  }}
                  className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                >
                  <option value="">-- Choose Chapter --</option>
                  {currentSection?.chapters.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {selectedChapter && (
              <div>
                <label className="text-xs text-zinc-400">Topic</label>
                <select 
                  required
                  value={form.topicId} 
                  onChange={e => setForm({...form, topicId: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
                >
                  <option value="">-- Choose Topic --</option>
                  {topicsList.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {/* AI Parameters */}
            {form.topicId && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="useNotes"
                    checked={form.useNotes}
                    onChange={e => setForm({...form, useNotes: e.target.checked})}
                    className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-600/20"
                  />
                  <label htmlFor="useNotes" className="text-sm text-zinc-300">Use Topic Notes for Reference</label>
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
                    <label className="text-xs text-zinc-400">Number of Questions (Max 5)</label>
                  </div>
                  <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    required
                    value={form.count} 
                    onChange={e => setForm({...form, count: Number(e.target.value)})}
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
              {loading ? "Generating..." : "Generate with AI"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
              <strong className="block mb-1 text-blue-400">Teacher Quota</strong>
              You can generate a maximum of 50 AI questions per day. Your teacher account acts as the creator.
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
                <Brain size={48} className="text-purple-500/50 animate-pulse" />
                <div className="absolute inset-0 border-t-2 border-purple-500 rounded-full animate-spin" />
              </div>
              <h4 className="text-lg font-medium text-white mt-4">Generating Questions...</h4>
              <p className="text-sm text-zinc-500 mt-2">Gemini 2.5 Flash is analyzing your curriculum context.</p>
            </Panel>
          )}

          {!loading && generatedQuestions.map((q, idx) => (
            <Panel key={idx} className="relative transition hover:border-purple-500/30 group">
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
                {q.options?.map((opt: any) => (
                  <div 
                    key={opt.id} 
                    className={`p-3 rounded-lg border text-sm ${opt.id === q.answerKey ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : 'bg-white/5 border-white/10 text-zinc-300'}`}
                  >
                    <span className="font-mono text-xs opacity-50 mr-2">{opt.id}.</span> {opt.text}
                    {opt.id === q.answerKey && <Check size={14} className="inline ml-2 text-emerald-400" />}
                  </div>
                ))}
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
                  {savedStatus[idx] ? <Check size={14} /> : savingIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {savedStatus[idx] ? 'Saved to Bank' : 'Save to Bank'}
                </button>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </>
  );
}
