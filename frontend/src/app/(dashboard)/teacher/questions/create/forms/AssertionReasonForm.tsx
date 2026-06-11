import Panel from "@/components/ui/Panel";
import { useEffect } from "react";

interface AssertionReasonFormProps {
  data: {
    options: { id: string; text: string }[];
    correct_option: string;
    correct_options: string[];
  };
  onChange: (data: any) => void;
}

const ASSERTION_OPTIONS = [
  { id: "A", text: "Both Assertion (A) and Reason (R) are true and R is the correct explanation of A." },
  { id: "B", text: "Both Assertion (A) and Reason (R) are true but R is NOT the correct explanation of A." },
  { id: "C", text: "Assertion (A) is true but Reason (R) is false." },
  { id: "D", text: "Assertion (A) is false but Reason (R) is true." }
];

export default function AssertionReasonForm({ data, onChange }: AssertionReasonFormProps) {
  // Ensure the options are perfectly set to the 4 defaults
  useEffect(() => {
    onChange({
      ...data,
      options: ASSERTION_OPTIONS,
      correct_options: [data.correct_option || "A"],
      correct_option: data.correct_option || "A"
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Panel className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Options (Assertion-Reasoning)
        </h2>
      </div>

      <div className="space-y-3">
        {ASSERTION_OPTIONS.map((opt) => (
          <div key={opt.id} className="flex items-center gap-4">
            <input
              type="radio"
              name="correct_option"
              value={opt.id}
              checked={data.correct_option === opt.id}
              onChange={(e) => onChange({ ...data, correct_option: e.target.value })}
              className="h-4 w-4 accent-red-500 cursor-pointer"
            />
            <span className="text-zinc-400 font-medium w-4">{opt.id}.</span>
            <div className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white opacity-80 cursor-not-allowed select-none">
              {opt.text}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
