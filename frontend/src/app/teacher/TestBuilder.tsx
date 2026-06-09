"use client";

import { useState } from "react";
import Panel from "@/components/ui/Panel";

export default function TestBuilder() {
  const [title, setTitle] = useState("");

  return (
    <Panel accent>
      <div className="space-y-5">
        <h3 className="text-xl font-semibold text-white">Create Test</h3>

        <input
          placeholder="Test name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <input
            placeholder="Duration (in minutes)"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
          />

          <input
            placeholder="Total marks"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
          />

          <input
            placeholder="Number of questions"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white"
          />
        </div>

        <button className="rounded-full bg-red-600 px-5 py-2 text-white">
          Save Test
        </button>
      </div>
    </Panel>
  );
}
