import Panel from "@/components/ui/Panel";

interface TrueFalseFormProps {
  data: {
    answer: boolean;
    options: { id: string; text: string }[];
    correct_option: string;
  };
  onChange: (data: any) => void;
}

export default function TrueFalseForm({ data, onChange }: TrueFalseFormProps) {
  const handleSelect = (val: boolean, optId: string) => {
    onChange({ ...data, answer: val, correct_option: optId });
  };
  return (
    <Panel className="space-y-5">
      <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">True / False Answer</h2>
      
      <div className="flex gap-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              name="tf_answer"
              checked={data.correct_option === "A" || (data.correct_option !== "A" && data.correct_option !== "B" && data.answer === true)}
              onChange={() => handleSelect(true, "A")}
              className="peer h-5 w-5 appearance-none rounded-full border border-white/20 bg-black/40 checked:border-emerald-500 checked:bg-emerald-500/20 transition-all cursor-pointer"
            />
            <div className="absolute h-2.5 w-2.5 rounded-full bg-emerald-500 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">A. {data.options?.[0]?.text || "True"}</span>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group bg-black/20 p-3 rounded-xl border border-white/5 pr-8">
          <div className="relative flex items-center justify-center">
            <input
              type="radio"
              name="tf_answer"
              checked={data.correct_option === "B" || (data.correct_option !== "A" && data.correct_option !== "B" && data.answer === false)}
              onChange={() => handleSelect(false, "B")}
              className="peer h-5 w-5 appearance-none rounded-full border border-white/20 bg-black/40 checked:border-red-500 checked:bg-red-500/20 transition-all cursor-pointer"
            />
            <div className="absolute h-2.5 w-2.5 rounded-full bg-red-500 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
          </div>
          <div className="flex flex-col">
             <span className="text-zinc-300 font-medium group-hover:text-white transition-colors">B. {data.options?.[1]?.text || "False"}</span>
          </div>
        </label>
      </div>
    </Panel>
  );
}
