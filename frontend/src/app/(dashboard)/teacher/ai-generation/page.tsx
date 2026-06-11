"use client";

import { useState, useEffect } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { AiService } from "@/services/ai.service";
import { QuestionsService } from "@/services/questions.service";
import { Brain, Save, Check, AlertTriangle, Loader2, Edit2, Trash2 } from "lucide-react";

export default function AIGenerationPage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    topicId: "",
    count: 5,
    contextNotes: ""
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    QuestionsService.getTopics().then(setTopics).catch(() => setError("Failed to load topics"));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topicId) {
      setError("Please select a topic");
      return;
    }
    
    setLoading(true);
    setError(null);
    setGeneratedQuestions([]);
    setSavedStatus({});

    try {
      const selectedTopic = topics.find(t => t.id === form.topicId);
      const res = await AiService.generateQuestions({
        topicName: selectedTopic.name,
        count: form.count,
        contextNotes: form.contextNotes
      });
      setGeneratedQuestions(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
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
        type: "SINGLE_CHOICE",
        content_json: { text: q.questionText },
        options_json: q.options,
        answer_key: { correct_option_id: q.answerKey },
        solution_json: { text: q.solutionText },
        difficulty: q.difficulty,
        marks: q.difficulty === "HARD" ? 4 : q.difficulty === "MEDIUM" ? 3 : 2,
        negative_marks: 1,
        approval_status: "AI_GENERATED"
      };

      await QuestionsService.create(mappedData);
      setSavedStatus(prev => ({ ...prev, [idx]: true }));
    } catch (err: any) {
      alert("Failed to save: " + (err?.response?.data?.message || err.message));
    } finally {
      setSavingIdx(null);
    }
  };

  const updateQuestionState = (idx: number, field: string, value: any) => {
    const updated = [...generatedQuestions];
    updated[idx] = { ...updated[idx], [field]: value };
    setGeneratedQuestions(updated);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <SectionTitle title="AI Question Generator" subtitle="Instantly generate multiple-choice questions using Gemini 2.5 Flash." />
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        <Panel className="md:col-span-1 space-y-4">
          <h3 className="text-sm font-medium text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Brain size={16} className="text-purple-400" />
            Generator Config
          </h3>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400">Select Topic</label>
              <select 
                required
                value={form.topicId} 
                onChange={e => setForm({...form, topicId: e.target.value})}
                className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500"
              >
                <option value="">-- Choose Topic --</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.chapter?.section?.course?.code} - {t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-400">Number of Questions (Max 20)</label>
              <input 
                type="number" 
                min="1" 
                max="20" 
                required
                value={form.count} 
                onChange={e => setForm({...form, count: Number(e.target.value)})}
                className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500" 
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Context Notes (Optional)</label>
              <textarea 
                value={form.contextNotes} 
                onChange={e => setForm({...form, contextNotes: e.target.value})}
                placeholder="Paste any context or reference notes here..."
                className="mt-1 block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-sm text-white focus:border-purple-500 min-h-[120px]" 
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
              {loading ? "Generating..." : "Generate Questions"}
            </button>
          </form>
        </Panel>

        <div className="md:col-span-2 space-y-4">
          {generatedQuestions.length === 0 && !loading && (
            <Panel className="flex flex-col items-center justify-center py-20 text-center border-dashed border-white/10 bg-white/[0.01]">
              <Brain size={48} className="text-zinc-800 mb-4" />
              <h3 className="text-lg font-medium text-zinc-400">Awaiting Generation</h3>
              <p className="text-sm text-zinc-600 max-w-sm mt-2">Configure the generator on the left to create high-quality MCQs powered by AI.</p>
            </Panel>
          )}

          {generatedQuestions.map((q, idx) => (
            <Panel key={idx} className={`transition-all duration-300 ${savedStatus[idx] ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-purple-500/20'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-white/10 text-white text-xs px-2 py-1 rounded">Q{idx + 1}</span>
                  <select 
                    value={q.difficulty} 
                    onChange={e => updateQuestionState(idx, 'difficulty', e.target.value)}
                    className="bg-black border border-white/10 text-xs rounded px-2 py-1 text-zinc-300"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                {savedStatus[idx] ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded font-medium">
                    <Check size={14} /> Saved to Bank
                  </span>
                ) : (
                  <button 
                    onClick={() => handleSaveQuestion(idx, q)}
                    disabled={savingIdx === idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-medium rounded hover:bg-zinc-200 transition disabled:opacity-50"
                  >
                    {savingIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Approve & Save
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <textarea 
                    value={q.questionText}
                    onChange={e => updateQuestionState(idx, 'questionText', e.target.value)}
                    className="w-full bg-transparent border-b border-white/10 px-1 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none overflow-hidden min-h-[40px]"
                    rows={1}
                  />
                </div>

                <div className="grid gap-2">
                  {q.options.map((opt: any, oIdx: number) => (
                    <div key={opt.id} className="flex items-center gap-3 bg-black/40 p-2 rounded border border-white/5">
                      <input 
                        type="radio" 
                        name={`correct-${idx}`} 
                        checked={q.answerKey === opt.id}
                        onChange={() => updateQuestionState(idx, 'answerKey', opt.id)}
                        className="accent-purple-500 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={opt.text}
                        onChange={e => {
                          const newOpts = [...q.options];
                          newOpts[oIdx].text = e.target.value;
                          updateQuestionState(idx, 'options', newOpts);
                        }}
                        className="flex-1 bg-transparent text-sm text-zinc-300 outline-none focus:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/5">
                  <label className="text-xs text-zinc-500 block mb-1">Solution / Explanation</label>
                  <textarea 
                    value={q.solutionText}
                    onChange={e => updateQuestionState(idx, 'solutionText', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-zinc-400 focus:border-purple-500 outline-none min-h-[60px]"
                  />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
