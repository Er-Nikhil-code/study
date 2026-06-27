"use client";

/**
 * TestProgressBar — shows a horizontal bar for student test results.
 *
 * Visual spec:
 * ┌───────────────────────────────────────────────────────────────┐
 * │  Marks: 28/40   │   Rank: 3/120   │   Cutoff: 20            │
 * │ ████████████████████████████░░░░░░│░░░░░░░░░░░░░░░░░░░░░░░░  │
 * └───────────────────────────────────────────────────────────────┘
 *
 *  - Bar fills from left to right proportionally to score / total_marks.
 *  - A thin white vertical line marks the cutoff position.
 *  - Bar color: emerald (pass) or red (fail) based on score vs cutoff.
 */

interface TestProgressBarProps {
  score: number | null;
  totalMarks: number;
  passingMarks: number | null;
  rank: number | null;
  totalAspirants: number;
}

export default function TestProgressBar({
  score,
  totalMarks,
  passingMarks,
  rank,
  totalAspirants,
}: TestProgressBarProps) {
  if (score === null || score === undefined) return null;

  const cutoff = passingMarks ?? 0;
  const passed = score >= cutoff;
  const pct = totalMarks > 0 ? Math.min((score / totalMarks) * 100, 100) : 0;
  const cutoffPct =
    totalMarks > 0 ? Math.min((cutoff / totalMarks) * 100, 100) : 0;

  return (
    <div className="w-full mt-2">
      {/* Stats row */}
      <div className="flex items-center justify-between text-[10px] font-semibold tracking-wide mb-1.5 px-0.5">
        <span className="text-zinc-400">
          Marks:{" "}
          <span className={passed ? "text-emerald-400" : "text-red-400"}>
            {score}
          </span>
          <span className="text-zinc-600">/{totalMarks}</span>
        </span>
        {cutoff > 0 && (
          <span className="text-zinc-400">
            Cutoff:{" "}
            <span className="text-zinc-300">{cutoff}</span>
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        {/* Score fill */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
            passed
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              : "bg-gradient-to-r from-red-500 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          }`}
          style={{ width: `${pct}%` }}
        />

        {/* Cutoff marker */}
        {cutoff > 0 && (
          <div
            className="absolute top-[-2px] bottom-[-2px] w-[2px] bg-white/80 rounded-full"
            style={{ left: `${cutoffPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
