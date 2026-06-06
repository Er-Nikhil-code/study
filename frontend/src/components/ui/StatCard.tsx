import Panel from "./Panel";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "red" | "green" | "amber";
};

const toneClasses = {
  default: "text-white",
  red: "text-red-400",
  green: "text-emerald-400",
  amber: "text-amber-400",
};

export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: StatCardProps) {
  return (
    <Panel className="p-4">
      <div className="text-sm text-zinc-400">{label}</div>
      <div
        className={[
          "mt-2 text-2xl font-semibold tracking-tight",
          toneClasses[tone],
        ].join(" ")}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </Panel>
  );
}
