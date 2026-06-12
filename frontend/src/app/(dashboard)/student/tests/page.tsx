"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { TestsService } from "@/services/tests.service";
import { Clock, CheckCircle, FileText, BarChart } from "lucide-react";

export default function StudentTestsPage() {
  const router = useRouter();
  
  const { data: res, isLoading, error } = useQuery({
    queryKey: ["student", "tests"],
    queryFn: () => TestsService.getAll(),
  });

  const tests = res?.data || [];

  return (
    <>
      <SectionTitle 
        title="Test Center" 
        subtitle="Attempt practice tests and mock exams" 
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <div className="text-zinc-500">Loading tests...</div>}
        {error && <div className="text-red-400">Failed to load tests.</div>}
        
        {!isLoading && tests.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-black/20 rounded-xl border border-white/5">
            No tests available at the moment.
          </div>
        )}

        {tests.map((test: any) => (
          <Panel key={test.id} className="flex flex-col relative overflow-hidden group hover:border-red-500/30 transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition">{test.title}</h3>
                <p className="text-xs text-zinc-400 mt-1">{test.topic?.name}</p>
              </div>
              <div className="bg-red-500/10 text-red-400 text-xs font-bold px-2 py-1 rounded">
                {test.duration_minutes} Mins
              </div>
            </div>

            <p className="text-sm text-zinc-400 mb-6 flex-1 line-clamp-2">
              {test.description || "No description provided."}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-black/40 rounded p-2 text-center border border-white/5">
                <span className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Marks</span>
                <span className="text-sm font-semibold text-white">{test.total_marks}</span>
              </div>
              <div className="bg-black/40 rounded p-2 text-center border border-white/5">
                <span className="block text-xs text-zinc-500 uppercase tracking-wider mb-1">Passing</span>
                <span className="text-sm font-semibold text-white">{test.passing_marks || "N/A"}</span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/student/tests/${test.id}`)}
              className="w-full bg-white/10 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition"
            >
              View Details
            </button>
          </Panel>
        ))}
      </div>
    </>
  );
}
