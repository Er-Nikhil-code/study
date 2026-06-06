"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Panel from "@/components/ui/Panel";
import QuestionPalette from "@/components/tests/QuestionPalette";
import TestTimer from "@/components/tests/TestTimer";
import SectionTitle from "@/components/ui/SectionTitle";

const questions = [
  {
    text: "What is 2 + 2?",
    options: ["1", "2", "4", "5"],
    answer: 2,
  },
  {
    text: "Which planet is known as the Red Planet?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    answer: 1,
  },
  {
    text: "The formula for area of a circle is?",
    options: ["πr²", "2πr", "πd", "r²"],
    answer: 0,
  },
];

export default function AttemptPage() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false);

  const palette = useMemo(
    () =>
      questions.map((_, index) => ({
        index,
        answered: answers[index] !== undefined && answers[index] !== null,
        current: current === index,
      })),
    [answers, current],
  );

  const score = questions.reduce(
    (acc, q, index) => acc + (answers[index] === q.answer ? 1 : 0),
    0,
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.10),_transparent_30%),linear-gradient(to_bottom,_#000,_#090909_50%,_#000)]">
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        <div className="space-y-6">
          <SectionTitle
            title="Timed attempt"
            subtitle="Local state only for now. This page is already structured for your future payload API."
          />

          <Panel accent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-red-300/70">
                  Question {current + 1} of {questions.length}
                </div>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {questions[current].text}
                </h2>
              </div>
              <TestTimer durationMinutes={90} />
            </div>

            <div className="mt-6 grid gap-3">
              {questions[current].options.map((option, idx) => {
                const selected = answers[current] === idx;
                return (
                  <button
                    key={option}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [current]: idx }))
                    }
                    className={[
                      "rounded-2xl border px-4 py-3 text-left text-sm transition",
                      selected
                        ? "border-red-500/40 bg-red-500/10 text-red-100"
                        : "border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/50 text-xs text-zinc-300">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setCurrent((v) => Math.max(0, v - 1))}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrent((v) => Math.min(questions.length - 1, v + 1))
                }
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]"
              >
                Next
              </button>
              <button
                onClick={() => setSubmitted(true)}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
              >
                Submit
              </button>
            </div>
          </Panel>

          {submitted ? (
            <Panel>
              <div className="text-sm text-zinc-400">Submitted</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                Score: {score}/{questions.length}
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                This placeholder score view is safe to replace later with the
                live attempt result response.
              </p>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-4">
          <QuestionPalette items={palette} onSelect={setCurrent} />
          <Panel>
            <div className="text-sm font-medium text-white">Actions</div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Keyboard shortcuts and autosave can be added later without
              changing this page structure.
            </p>
          </Panel>
        </div>
      </main>
    </div>
  );
}
