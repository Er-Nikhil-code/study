"use client";

import { useQuery } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { Users, CheckCircle, FileQuestion, Activity } from "lucide-react";
import { api } from "@/lib/api";

export default function TeacherInternsPage() {
  const { data: interns = [], isLoading, error } = useQuery({
    queryKey: ["teacher", "interns"],
    queryFn: () => api.get("/teacher/interns").then((res) => res.data),
  });

  const renderHeatmap = (heatmapData: { date: string; count: number }[]) => {
    // Generate last 30 days
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const countMap = new Map(heatmapData.map((h) => [h.date, h.count]));

    return (
      <div className="flex gap-1 overflow-x-auto pb-2">
        {days.map((date) => {
          const count = countMap.get(date) || 0;
          let color = "bg-zinc-800"; // 0
          if (count > 0 && count <= 2) color = "bg-emerald-900";
          else if (count > 2 && count <= 5) color = "bg-emerald-700";
          else if (count > 5 && count <= 10) color = "bg-emerald-500";
          else if (count > 10) color = "bg-emerald-400";

          return (
            <div
              key={date}
              title={`${date}: ${count} submissions`}
              className={`w-4 h-4 rounded-sm ${color} transition-colors hover:ring-1 hover:ring-white flex-shrink-0 cursor-pointer`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <>
      <SectionTitle
        title="My Interns"
        subtitle="Track the progress and activity of interns assigned to you."
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          Failed to load interns data.
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {interns.map((intern: any) => (
            <Panel key={intern.id} className="flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <Users size={120} />
              </div>
              
              <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 text-purple-400 font-bold text-lg shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                  {intern.first_name?.[0] || intern.email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {intern.first_name} {intern.last_name}
                  </h3>
                  <p className="text-xs text-zinc-400">{intern.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="rounded-lg bg-zinc-900/50 p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <FileQuestion size={14} className="text-blue-400" />
                    <span className="text-xs font-medium">Submitted</span>
                  </div>
                  <p className="text-xl font-bold text-white">{intern.stats.total_submitted}</p>
                </div>
                
                <div className="rounded-lg bg-zinc-900/50 p-3 border border-white/5">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <CheckCircle size={14} className="text-emerald-400" />
                    <span className="text-xs font-medium">Approval</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-xl font-bold text-white">{intern.stats.approval_rate}</p>
                    <span className="text-sm font-semibold text-emerald-500">%</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto relative z-10">
                <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium mb-3">
                  <Activity size={16} className="text-purple-400" />
                  30-Day Activity Heatmap
                </div>
                {renderHeatmap(intern.stats.heatmap)}
              </div>
            </Panel>
          ))}
          
          {interns.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <Users size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No interns are currently assigned to you.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
