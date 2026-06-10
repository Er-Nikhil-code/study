"use client";

import { useQuery } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { api } from "@/lib/api";

export default function InternEarningsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["intern", "earnings"],
    queryFn: async () => {
      const res = await api.get("/student/intern/earnings");
      return res.data;
    },
  });

  const percent = data ? Math.min(100, (data.progress / data.levelMax) * 100) : 0;

  return (
    <>
      <SectionTitle
        title="My Earnings"
        subtitle="Track your approved questions and monthly rewards."
      />

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load earnings data.
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.02]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.02]" />
        </div>
      ) : data ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Panel className="flex flex-col items-center justify-center p-8 text-center border border-red-500/20 bg-gradient-to-b from-red-500/10 to-transparent">
              <div className="text-sm font-medium text-red-400 uppercase tracking-widest mb-2">Current Level</div>
              <div className="text-6xl font-bold text-white mb-2">{data.currentLevel}</div>
              <div className="text-xs text-zinc-500">Keep submitting quality questions to level up!</div>
            </Panel>
            
            <Panel className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-2">Total Earnings</div>
              <div className="text-5xl font-bold text-emerald-400 mb-2">₹{data.totalEarnings}</div>
              <div className="text-xs text-zinc-500">Based on {data.totalApprovedQuestions} approved questions</div>
            </Panel>

            <Panel className="flex flex-col items-center justify-center p-8 text-center">
              <div className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-2">Approved Questions</div>
              <div className="text-5xl font-bold text-white mb-2">{data.totalApprovedQuestions}</div>
              <div className="text-xs text-zinc-500">Quality over quantity</div>
            </Panel>
          </div>

          <Panel>
            <h3 className="text-lg font-medium text-white mb-4">Level Progress</h3>
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Level {data.currentLevel}</span>
              <span>Level {data.currentLevel + 1}</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${percent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="mt-3 text-center text-sm text-zinc-500">
              {data.progress} / {data.levelMax} questions approved for this level tier
            </div>
          </Panel>

          <Panel className="bg-black border border-white/5">
            <h3 className="text-lg font-medium text-white mb-4">Earnings Tiers</h3>
            <div className="space-y-3 text-sm text-zinc-400">
              <div className={`flex justify-between border-b border-white/5 pb-2 ${data.currentLevel === 1 ? 'text-red-400 font-medium' : ''}`}>
                <span>Level 1 (0 - 300 questions)</span>
                <span>₹3 per question</span>
              </div>
              <div className={`flex justify-between border-b border-white/5 pb-2 ${data.currentLevel === 2 ? 'text-red-400 font-medium' : ''}`}>
                <span>Level 2 (301 - 800 questions)</span>
                <span>₹4 per question</span>
              </div>
              <div className={`flex justify-between border-b border-white/5 pb-2 ${data.currentLevel === 3 ? 'text-red-400 font-medium' : ''}`}>
                <span>Level 3 (801 - 1300 questions)</span>
                <span>₹5 per question</span>
              </div>
              <div className={`flex justify-between border-b border-white/5 pb-2 ${data.currentLevel === 4 ? 'text-red-400 font-medium' : ''}`}>
                <span>Level 4 (1301 - 1800 questions)</span>
                <span>₹6 per question</span>
              </div>
              <div className="flex justify-between pt-1 italic text-zinc-500">
                <span>Every +500 questions</span>
                <span>+₹1 per question</span>
              </div>
            </div>
          </Panel>
        </div>
      ) : null}
    </>
  );
}
