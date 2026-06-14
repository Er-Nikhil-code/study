import Link from "next/link";
import Panel from "../ui/Panel";
import { TestSeriesTestItem } from "@/services/student.service";

export default function TestSeriesCard({ test }: { test: TestSeriesTestItem }) {
  const hasAttempt = !!test.latest_attempt && test.latest_attempt.status === "SCORED";
  const score = test.latest_attempt?.score ?? 0;
  const maxScore = test.latest_attempt?.max_score ?? test.total_marks;
  const passingMarks = test.passing_marks ?? 0;
  const rank = test.latest_attempt?.rank ?? 0;
  const totalParticipants = test._count.attempts ?? 0;
  
  const progressPercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const cutoffPercentage = maxScore > 0 ? (passingMarks / maxScore) * 100 : 0;
  const isPassed = score >= passingMarks;

  return (
    <Panel className="p-4 flex flex-col hover:border-red-500/30 hover:bg-white/[0.02] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{test.title}</h3>
          {test.description && <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{test.description}</p>}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-zinc-300">
        <div className="rounded-2xl bg-white/[0.03] p-3 text-center">
          <div className="text-xs text-zinc-500">Duration</div>
          <div className="mt-1 font-medium">{test.duration_minutes} min</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3 text-center">
          <div className="text-xs text-zinc-500">Questions</div>
          <div className="mt-1 font-medium">{test._count.test_questions}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3 text-center">
          <div className="text-xs text-zinc-500">Max Marks</div>
          <div className="mt-1 font-medium">{test.total_marks}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/tests/${test.id}/attempt`}
          className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-blue-500"
        >
          {test.latest_attempt ? "Re-attempt" : "Attempt"}
        </Link>
      </div>

      {hasAttempt && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-zinc-300">Score: {score} / {maxScore}</span>
            {rank > 0 && (
              <span className="text-zinc-400">Rank: {rank}/{totalParticipants}</span>
            )}
            <span className="text-zinc-400">Cutoff: {passingMarks}</span>
          </div>
          
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full transition-all duration-500 ${isPassed ? "bg-emerald-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
            {passingMarks > 0 && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10" 
                style={{ left: `${Math.min(cutoffPercentage, 100)}%` }}
              />
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
