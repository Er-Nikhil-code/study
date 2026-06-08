import Panel from "@/components/ui/Panel";

interface PassageFormProps {
  data: {
    sub_questions: any[];
    answers: Record<string, any>;
  };
  onChange: (data: any) => void;
}

export default function PassageForm({ data, onChange }: PassageFormProps) {
  const addSubQuestion = () => {
    const nextId = `Q${data.sub_questions.length + 1}`;
    onChange({
      ...data,
      sub_questions: [
        ...data.sub_questions,
        {
          id: nextId,
          question_text: "",
          question_type: "SINGLE_CORRECT",
          options: [
            { id: "A", text: "" },
            { id: "B", text: "" },
            { id: "C", text: "" },
            { id: "D", text: "" }
          ]
        }
      ],
      answers: { ...data.answers, [nextId]: "A" }
    });
  };

  const updateSubQuestion = (index: number, field: string, value: any) => {
    const newQs = [...data.sub_questions];
    newQs[index] = { ...newQs[index], [field]: value };
    
    // If type changed to TRUE_FALSE, reset options and answer
    if (field === "question_type" && value === "TRUE_FALSE") {
      newQs[index].options = [
        { id: "True", text: "True" },
        { id: "False", text: "False" }
      ];
      onChange({ ...data, sub_questions: newQs, answers: { ...data.answers, [newQs[index].id]: "True" } });
      return;
    }

    onChange({ ...data, sub_questions: newQs });
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const newQs = [...data.sub_questions];
    newQs[qIndex].options[oIndex].text = text;
    onChange({ ...data, sub_questions: newQs });
  };

  const setAnswer = (qId: string, answer: any) => {
    onChange({ ...data, answers: { ...data.answers, [qId]: answer } });
  };

  const toggleMultipleAnswer = (qId: string, optId: string) => {
    const current = Array.isArray(data.answers[qId]) ? data.answers[qId] : [];
    let next;
    if (current.includes(optId)) {
      next = current.filter((x: string) => x !== optId);
    } else {
      next = [...current, optId];
    }
    onChange({ ...data, answers: { ...data.answers, [qId]: next } });
  };

  const removeSubQuestion = (index: number) => {
    const qToRemove = data.sub_questions[index].id;
    const newQs = data.sub_questions.filter((_, i) => i !== index);
    const newAnswers = { ...data.answers };
    delete newAnswers[qToRemove];
    onChange({ ...data, sub_questions: newQs, answers: newAnswers });
  };

  return (
    <Panel className="space-y-6 bg-black/20 border border-white/5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Sub-Questions</h2>
          <p className="text-xs text-zinc-400 mt-1">Questions based on the passage above.</p>
        </div>
        <button type="button" onClick={addSubQuestion} className="text-xs text-red-400 hover:text-red-300">
          + Add Sub-Question
        </button>
      </div>

      <div className="space-y-6">
        {data.sub_questions.map((sq, i) => (
          <div key={sq.id} className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-center justify-center h-6 w-6 rounded bg-red-500/10 text-xs font-bold text-red-400 shrink-0 mt-1">
                {i + 1}
              </span>
              <div className="flex-1 space-y-3">
                <textarea
                  required
                  rows={2}
                  value={sq.question_text}
                  onChange={(e) => updateSubQuestion(i, "question_text", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/30"
                  placeholder="Sub-question statement..."
                />
                
                <div className="flex items-center gap-3">
                  <select
                    value={sq.question_type}
                    onChange={(e) => updateSubQuestion(i, "question_type", e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-zinc-300 outline-none"
                  >
                    <option value="SINGLE_CORRECT">Single Correct</option>
                    <option value="MULTIPLE_CORRECT">Multiple Correct</option>
                    <option value="TRUE_FALSE">True / False</option>
                  </select>
                </div>

                {/* Options & Answers */}
                <div className="space-y-2 mt-4 bg-black/20 p-3 rounded-lg">
                  <div className="text-xs font-medium text-zinc-500 mb-2">Options & Correct Answer:</div>
                  {sq.options.map((opt: any, oIndex: number) => (
                    <div key={opt.id} className="flex items-center gap-3">
                      {sq.question_type === "MULTIPLE_CORRECT" ? (
                        <input
                          type="checkbox"
                          checked={(Array.isArray(data.answers[sq.id]) ? data.answers[sq.id] : []).includes(opt.id)}
                          onChange={() => toggleMultipleAnswer(sq.id, opt.id)}
                          className="h-3.5 w-3.5 accent-red-500"
                        />
                      ) : (
                        <input
                          type="radio"
                          name={`answer_${sq.id}`}
                          checked={data.answers[sq.id] === opt.id}
                          onChange={() => setAnswer(sq.id, opt.id)}
                          className="h-3.5 w-3.5 accent-red-500"
                        />
                      )}
                      
                      {sq.question_type === "TRUE_FALSE" ? (
                        <span className="text-sm text-white">{opt.text}</span>
                      ) : (
                        <>
                          <span className="text-xs font-mono text-zinc-500 w-4">{opt.id}.</span>
                          <input
                            type="text"
                            required
                            value={opt.text}
                            onChange={(e) => updateOption(i, oIndex, e.target.value)}
                            className="flex-1 rounded border border-white/5 bg-transparent px-2 py-1 text-sm text-white outline-none focus:border-red-500/30"
                            placeholder={`Option ${opt.id}`}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => removeSubQuestion(i)} className="text-zinc-500 hover:text-red-400 p-1">
                ×
              </button>
            </div>
          </div>
        ))}
        {data.sub_questions.length === 0 && (
          <div className="text-center py-6 text-sm text-zinc-500">
            No sub-questions added yet.
          </div>
        )}
      </div>
    </Panel>
  );
}
