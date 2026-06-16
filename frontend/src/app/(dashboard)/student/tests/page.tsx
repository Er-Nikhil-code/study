"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { studentService } from "@/services/student.service";
import { Clock, CheckCircle, FileText, BarChart } from "lucide-react";

export default function StudentTestsPage() {
  const router = useRouter();
  
  const { data: res, isLoading, error } = useQuery({
    queryKey: ["student", "all_tests"],
    queryFn: () => studentService.getTestSeriesTests({ limit: 100 }), // large limit or no limit
  });

  const tests = res?.data || [];

  return (
    <>
      <SectionTitle 
        title="Test Center" 
        subtitle="Attempt practice tests and mock exams" 
      />

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading && <div className="text-zinc-500 text-sm">Loading tests...</div>}
        {error && <div className="text-red-400 text-sm">Failed to load tests.</div>}
        
        {!isLoading && tests.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-zinc-500 bg-black/20 rounded-xl border border-white/5">
            No tests available at the moment.
          </div>
        )}

        {tests.map((test: any) => {
          const attempt = test.latest_attempt;
          const hasAttempted = !!attempt;
          const passingMarks = test.passing_marks || 0;
          const score = attempt?.score || 0;
          const passed = score >= passingMarks;
          const totalAttempts = test._count?.attempts || 0;
          
          // To compute rank total students, totalAttempts is a proxy for total participants.
          // Fallback to 1 if the user is the only one who attempted.
          const totalParticipants = Math.max(totalAttempts, attempt?.rank || 1);

          return (
            <Panel key={test.id} className="flex flex-col relative overflow-hidden group hover:border-red-500/30 transition p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-3 min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition truncate">{test.title}</h3>
                  {test.test_type && <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">{test.test_type.replace('_', ' ')}</p>}
                </div>
                <div className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shrink-0">
                  {test.duration_minutes} Mins
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-4 flex-1 line-clamp-2">
                {test.description || "No description provided."}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-black/40 rounded p-1.5 text-center border border-white/5">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Total Marks</span>
                  <span className="text-xs font-semibold text-white">{test.total_marks}</span>
                </div>
                <div className="bg-black/40 rounded p-1.5 text-center border border-white/5">
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Questions</span>
                  <span className="text-xs font-semibold text-white">{test._count?.test_questions || 0}</span>
                </div>
              </div>

              {hasAttempted && (
                <div className={`mt-auto mb-4 rounded-md border p-2 flex items-center justify-between text-xs ${passed ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[10px] uppercase opacity-80 tracking-wider">Marks</span>
                    <span className="font-bold">{score} / {test.total_marks}</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 border-l border-r border-current/20 px-3 mx-1">
                    <span className="text-[10px] uppercase opacity-80 tracking-wider">Rank</span>
                    <span className="font-bold">{attempt.rank ? `#${attempt.rank}` : '—'} / {totalParticipants}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] uppercase opacity-80 tracking-wider">Cutoff</span>
                    <span className="font-bold">{passingMarks}</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push(`/student/tests/${test.id}`)}
                className={`w-full text-white text-xs font-medium py-2 rounded transition mt-auto ${hasAttempted ? "bg-white/10 hover:bg-white/20" : "bg-red-600 hover:bg-red-500"}`}
              >
                {hasAttempted ? "View Details" : "Start Test"}
              </button>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
