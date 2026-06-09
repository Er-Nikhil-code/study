"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import studentService, { type StudentDashboard } from "@/services/student.service";
import Panel from "@/components/ui/Panel";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuthStore } from "@/store/auth.store";

export default function InternDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading: loading, isFetching } = useQuery({
    queryKey: ["intern", "dashboard"],
    queryFn: async () => {
      return await studentService.getDashboard();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });



  if (!user) return null;
  const name = user.email.split("@")[0];

  return (
    <DashboardShell activeHref="/intern/dashboard">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Welcome back, {name}</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your question bank contributions.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : dashboardData ? (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4" id="stats">
            <Panel accent>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total Points</div>
              <div className="mt-2 text-3xl font-semibold text-red-300">{dashboardData.total_score || 0}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Global Rank</div>
              <div className="mt-2 text-3xl font-semibold text-white">#{dashboardData.global_rank || "—"}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Current Streak</div>
              <div className="mt-2 text-3xl font-semibold text-white">{dashboardData.current_streak}🔥</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Longest Streak</div>
              <div className="mt-2 text-3xl font-semibold text-white">{dashboardData.longest_streak} days</div>
            </Panel>
          </div>

          <div className="mt-8">
            <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500 mb-4">Content Management</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/teacher/questions/create" className="group rounded-2xl border border-red-500/20 bg-red-500/5 p-4 transition hover:bg-red-500/10 block">
                <div className="text-sm font-medium text-red-300">Create Question</div>
                <p className="text-xs text-zinc-500 mt-1">Submit new content</p>
              </Link>
              <Link href="/teacher/questions?status=draft" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06] block">
                <div className="text-sm font-medium text-white">Drafts</div>
                <p className="text-xs text-zinc-500 mt-1">Continue working</p>
              </Link>
              <Link href="/teacher/questions?status=submitted" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06] block">
                <div className="text-sm font-medium text-white">Submitted</div>
                <p className="text-xs text-zinc-500 mt-1">Pending approval</p>
              </Link>
              <Link href="/teacher/questions?status=rejected" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06] block">
                <div className="text-sm font-medium text-white">Rejected</div>
                <p className="text-xs text-zinc-500 mt-1">Requires revision</p>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </DashboardShell>
  );
}
