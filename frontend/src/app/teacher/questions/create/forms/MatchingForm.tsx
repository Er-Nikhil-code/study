import Panel from "@/components/ui/Panel";

interface MatchingFormProps {
  data: {
    left_column: { id: string; text: string }[];
    right_column: { id: string; text: string }[];
    pairs: { left_id: string; right_id: string }[];
  };
  onChange: (data: any) => void;
}

export default function MatchingForm({ data, onChange }: MatchingFormProps) {
  const updateColumn = (col: "left_column" | "right_column", index: number, text: string) => {
    const newCol = [...data[col]];
    newCol[index].text = text;
    onChange({ ...data, [col]: newCol });
  };

  const addRow = (col: "left_column" | "right_column", prefix: string) => {
    const nextId = `${prefix}${data[col].length + 1}`;
    onChange({
      ...data,
      [col]: [...data[col], { id: nextId, text: "" }]
    });
  };

  const removeRow = (col: "left_column" | "right_column", index: number) => {
    if (data[col].length <= 1) return;
    const itemToRemove = data[col][index].id;
    
    const newCol = data[col].filter((_, i) => i !== index);
    
    // Remove any pairs associated with this item
    const newPairs = data.pairs.filter(
      p => p.left_id !== itemToRemove && p.right_id !== itemToRemove
    );

    onChange({ ...data, [col]: newCol, pairs: newPairs });
  };

  const addPair = () => {
    const leftOpts = data.left_column;
    const rightOpts = data.right_column;
    if (!leftOpts.length || !rightOpts.length) return;
    
    onChange({
      ...data,
      pairs: [...data.pairs, { left_id: leftOpts[0].id, right_id: rightOpts[0].id }]
    });
  };

  const updatePair = (index: number, side: "left_id" | "right_id", value: string) => {
    const newPairs = [...data.pairs];
    newPairs[index][side] = value;
    onChange({ ...data, pairs: newPairs });
  };

  const removePair = (index: number) => {
    const newPairs = data.pairs.filter((_, i) => i !== index);
    onChange({ ...data, pairs: newPairs });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Left Column</h2>
            <button type="button" onClick={() => addRow("left_column", "L")} className="text-xs text-red-400 hover:text-red-300">
              + Add Item
            </button>
          </div>
          <div className="space-y-3">
            {data.left_column.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-500 w-6">{item.id}</span>
                <input
                  type="text"
                  required
                  value={item.text}
                  onChange={(e) => updateColumn("left_column", i, e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/30"
                  placeholder="Item text"
                />
                <button type="button" onClick={() => removeRow("left_column", i)} className="text-zinc-500 hover:text-red-400">
                  ×
                </button>
              </div>
            ))}
          </div>
        </Panel>

        {/* Right Column */}
        <Panel className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Right Column</h2>
            <button type="button" onClick={() => addRow("right_column", "R")} className="text-xs text-red-400 hover:text-red-300">
              + Add Item
            </button>
          </div>
          <div className="space-y-3">
            {data.right_column.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-500 w-6">{item.id}</span>
                <input
                  type="text"
                  required
                  value={item.text}
                  onChange={(e) => updateColumn("right_column", i, e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/30"
                  placeholder="Match text"
                />
                <button type="button" onClick={() => removeRow("right_column", i)} className="text-zinc-500 hover:text-red-400">
                  ×
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Answer Key Pairs */}
      <Panel className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Correct Pairs</h2>
            <p className="text-xs text-zinc-400 mt-1">Define the correct matching relationships</p>
          </div>
          <button type="button" onClick={addPair} className="text-xs text-red-400 hover:text-red-300">
            + Add Pair
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.pairs.map((pair, i) => (
            <div key={i} className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
              <select
                value={pair.left_id}
                onChange={(e) => updatePair(i, "left_id", e.target.value)}
                className="w-full bg-transparent text-white text-xs outline-none"
              >
                {data.left_column.map(l => <option key={l.id} value={l.id} className="bg-zinc-900">{l.id}</option>)}
              </select>
              <span className="text-zinc-500">→</span>
              <select
                value={pair.right_id}
                onChange={(e) => updatePair(i, "right_id", e.target.value)}
                className="w-full bg-transparent text-white text-xs outline-none"
              >
                {data.right_column.map(r => <option key={r.id} value={r.id} className="bg-zinc-900">{r.id}</option>)}
              </select>
              <button type="button" onClick={() => removePair(i)} className="text-zinc-500 hover:text-red-400 ml-1">
                ×
              </button>
            </div>
          ))}
        </div>
        {data.pairs.length === 0 && (
          <p className="text-xs text-red-400">Please define at least one correct pair.</p>
        )}
      </Panel>
    </div>
  );
}
