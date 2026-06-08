import Panel from "@/components/ui/Panel";

interface TrueFalseFormProps {
  data: {
    answer: boolean;
  };
  onChange: (data: any) => void;
}

export default function TrueFalseForm({ data, onChange }: TrueFalseFormProps) {
  return (
    <Panel className="space-y-5">
      <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">True / False Answer</h2>
      
      <div className="flex gap-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              name="tf_answer"
              checked={data.answer === true}
              onChange={() => onChange({ answer: true })}
              className="peer h-5 w-5 appearance-none rounded-full border border-white/20 bg-black/40 checked:border-emerald-500 checked:bg-emerald-500/20 transition-all cursor-pointer"
            />
            <div className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
          </div>
          <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">True</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              name="tf_answer"
              checked={data.answer === false}
              onChange={() => onChange({ answer: false })}
              className="peer h-5 w-5 appearance-none rounded-full border border-white/20 bg-black/40 checked:border-red-500 checked:bg-red-500/20 transition-all cursor-pointer"
            />
            <div className="absolute h-2.5 w-2.5 rounded-full bg-red-500 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
          </div>
          <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">False</span>
        </label>
      </div>
    </Panel>
  );
}
