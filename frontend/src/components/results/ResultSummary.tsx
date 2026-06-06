import Panel from "../ui/Panel";
import StatCard from "../ui/StatCard";

type ResultSummaryProps = {
  score: number;
  maxScore: number;
  percentile: number;
  timeTaken: string;
  correct: number;
  wrong: number;
  skipped: number;
};

export default function ResultSummary({
  score,
  maxScore,
  percentile,
  timeTaken,
  correct,
  wrong,
  skipped,
}: ResultSummaryProps) {
  return (
    <div className="space-y-4">
      <Panel accent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-zinc-400">Overall score</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight text-white">
              {score}/{maxScore}
            </div>
          </div>
          <div className="text-sm text-zinc-400">
            Percentile{" "}
            <span className="font-semibold text-red-300">{percentile}</span>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Correct" value={correct} tone="green" />
        <StatCard label="Wrong" value={wrong} tone="red" />
        <StatCard label="Skipped" value={skipped} tone="amber" />
        <StatCard label="Time taken" value={timeTaken} />
      </div>
    </div>
  );
}
