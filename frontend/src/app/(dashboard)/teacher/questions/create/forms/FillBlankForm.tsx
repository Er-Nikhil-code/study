import Panel from "@/components/ui/Panel";

interface FillBlankFormProps {
  data: {
    blanks: { position: number; answer: string; case_sensitive: boolean }[];
    options?: { id: string; text: string }[];
    correct_option?: string;
  };
  onChange: (data: any) => void;
}

export default function FillBlankForm({ data, onChange }: FillBlankFormProps) {
  const handleOptionChange = (optId: string, text: string) => {
    const newOptions = data.options?.map(o => o.id === optId ? { ...o, text } : o) || [];
    const newData = { ...data, options: newOptions };
    // If this option is currently selected as correct, sync its text to the first blank
    if (data.correct_option === optId && newData.blanks.length > 0) {
      newData.blanks[0].answer = text;
    }
    onChange(newData);
  };

  const handleCorrectOptionSelect = (optId: string) => {
    const optText = data.options?.find(o => o.id === optId)?.text || "";
    const newData = { ...data, correct_option: optId };
    if (newData.blanks.length > 0) {
      newData.blanks[0].answer = optText;
    }
    onChange(newData);
  };
  const addBlank = () => {
    const nextPos = data.blanks.length + 1;
    onChange({
      blanks: [...data.blanks, { position: nextPos, answer: "", case_sensitive: false }]
    });
  };

  const removeBlank = (index: number) => {
    const newBlanks = data.blanks.filter((_, i) => i !== index).map((b, i) => ({ ...b, position: i + 1 }));
    onChange({ blanks: newBlanks });
  };

  const updateBlank = (index: number, field: string, value: any) => {
    const newBlanks = [...data.blanks];
    newBlanks[index] = { ...newBlanks[index], [field]: value };
    onChange({ blanks: newBlanks });
  };

  return (
    <Panel className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Blanks</h2>
          <p className="text-xs text-zinc-400 mt-1">Add blanks corresponding to ___ in your statement.</p>
        </div>
        <button
          type="button"
          onClick={addBlank}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          + Add Blank
        </button>
      </div>

      <div className="space-y-4">
        {data.blanks.map((blank, i) => (
          <div key={i} className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 text-xs font-bold text-zinc-400">
              {blank.position}
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                required
                value={blank.answer}
                onChange={(e) => updateBlank(i, "answer", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-red-500/30"
                placeholder="Correct answer"
              />
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={blank.case_sensitive}
                onChange={(e) => updateBlank(i, "case_sensitive", e.target.checked)}
                className="h-4 w-4 accent-red-500 cursor-pointer rounded bg-black/40 border border-white/10"
              />
              <span className="text-xs text-zinc-400">Case Sensitive</span>
            </label>

            <button
              type="button"
              onClick={() => removeBlank(i)}
              disabled={data.blanks.length <= 1}
              className="p-2 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {data.options && data.options.length > 0 && (
        <div className="pt-6 mt-6 border-t border-white/10 space-y-4">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Options (MCQ View)</h2>
          <div className="space-y-3">
            {data.options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
                <input
                  type="radio"
                  name="correct_option"
                  value={opt.id}
                  checked={data.correct_option === opt.id}
                  onChange={() => handleCorrectOptionSelect(opt.id)}
                  className="h-4 w-4 accent-red-500 cursor-pointer"
                />
                <span className="text-zinc-400 font-medium w-4">{opt.id}.</span>
                <input
                  type="text"
                  required
                  value={opt.text}
                  onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-red-500/30"
                  placeholder={`Option ${opt.id}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
