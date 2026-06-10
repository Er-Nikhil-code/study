import Panel from "@/components/ui/Panel";

interface McqFormProps {
  type: string;
  data: {
    options: { id: string; text: string }[];
    correct_option: string;
    correct_options: string[];
  };
  onChange: (data: any) => void;
}

export default function McqForm({ type, data, onChange }: McqFormProps) {
  const isMultiple = type === "MULTIPLE_CORRECT";

  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...data.options];
    newOptions[index].text = text;
    onChange({ ...data, options: newOptions });
  };

  const toggleMultipleCorrect = (id: string) => {
    let newCorrect = [...data.correct_options];
    if (newCorrect.includes(id)) {
      newCorrect = newCorrect.filter((c) => c !== id);
    } else {
      newCorrect.push(id);
    }
    onChange({ ...data, correct_options: newCorrect });
  };

  const addOption = () => {
    if (data.options.length >= 6) return;
    const nextId = String.fromCharCode(65 + data.options.length);
    onChange({ ...data, options: [...data.options, { id: nextId, text: "" }] });
  };

  const removeOption = () => {
    if (data.options.length <= 2) return;
    const newOptions = data.options.slice(0, -1);
    
    // Ensure correct_option/correct_options still exist
    const newCorrect = isMultiple
      ? data.correct_options.filter(id => newOptions.some(o => o.id === id))
      : (newOptions.some(o => o.id === data.correct_option) ? data.correct_option : newOptions[0].id);

    onChange({ 
      ...data, 
      options: newOptions,
      correct_options: isMultiple ? (newCorrect.length ? newCorrect : [newOptions[0].id]) : data.correct_options,
      correct_option: !isMultiple ? newCorrect : data.correct_option
    });
  };

  return (
    <Panel className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Options ({isMultiple ? "Multiple Correct" : "Single Correct"})
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={removeOption}
            disabled={data.options.length <= 2}
            className="text-xs text-zinc-400 hover:text-white disabled:opacity-30"
          >
            - Remove Option
          </button>
          <button
            type="button"
            onClick={addOption}
            disabled={data.options.length >= 6}
            className="text-xs text-red-400 hover:text-red-300 disabled:opacity-30"
          >
            + Add Option
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {data.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-4">
            {isMultiple ? (
              <input
                type="checkbox"
                checked={data.correct_options.includes(opt.id)}
                onChange={() => toggleMultipleCorrect(opt.id)}
                className="h-4 w-4 accent-red-500 cursor-pointer rounded bg-black/40 border border-white/10"
              />
            ) : (
              <input
                type="radio"
                name="correct_option"
                value={opt.id}
                checked={data.correct_option === opt.id}
                onChange={(e) => onChange({ ...data, correct_option: e.target.value })}
                className="h-4 w-4 accent-red-500 cursor-pointer"
              />
            )}
            <span className="text-zinc-400 font-medium w-4">{opt.id}.</span>
            <input
              type="text"
              required
              value={opt.text}
              onChange={(e) => updateOptionText(i, e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-red-500/30"
              placeholder={`Option ${opt.id}`}
            />
          </div>
        ))}
      </div>
      {isMultiple && data.correct_options.length === 0 && (
        <p className="text-xs text-red-400">Please select at least one correct option.</p>
      )}
    </Panel>
  );
}
