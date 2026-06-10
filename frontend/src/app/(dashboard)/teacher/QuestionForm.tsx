"use client";

import { useState } from "react";
import Panel from "@/components/ui/Panel";

export default function QuestionForm() {
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");

  return (
    <Panel accent>
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-semibold text-white">Create Question</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Supports future Tiptap + KaTeX integration.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-300">
            Question Statement
          </label>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={6}
            className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-red-500/30"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-300">Solution</label>

          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={6}
            className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-red-500/30"
          />
        </div>

        <div className="flex gap-3">
          <button className="rounded-full bg-red-600 px-5 py-2 text-white">
            Save Question
          </button>

          <button className="rounded-full border border-white/10 px-5 py-2 text-zinc-300">
            Preview
          </button>
        </div>
      </div>
    </Panel>
  );
}
