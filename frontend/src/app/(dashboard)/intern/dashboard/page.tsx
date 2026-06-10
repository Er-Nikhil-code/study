"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import studentService from "@/services/student.service";
import Panel from "@/components/ui/Panel";
import { useAuthStore } from "@/store/auth.store";
import { PlusCircle, FileCheck, Clock, XCircle, RefreshCw, TrendingUp } from "lucide-react";
import ActivityGraph from "@/components/ui/ActivityGraph";

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-300",
  PENDING_REVIEW: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  NEEDS_REVISION: "border-orange-500/20 bg-orange-500/10 text-orange-300",
  DRAFT: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PENDING_REVIEW: "In Review",
  NEEDS_REVISION: "Needs Revision",
  DRAFT: "Draft",
};

export default function InternDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["intern", "dashboard"],
    queryFn: () => studentService.getInternDashboard(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  if (!user) return null;
  const firstName = (user as any).first_name || user.firstName;
  const lastName = (user as any).last_name || user.lastName;
  const name = firstName
    ? `${firstName}${lastName ? ` ${lastName}` : ""}`
    : user.email.split("@")[0];

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Welcome back, {name}</h1>
          <p className="text-sm text-zinc-500 mt-1">Your content contribution overview.</p>
        </div>
        <Link
          href="/teacher/questions/create"
          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
        >
          <PlusCircle size={16} />
          Create Question
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Panel>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <FileCheck size={12} />
                Total Created
              </div>
              <div className="mt-2 text-3xl font-semibold text-white">{data.total_created}</div>
            </Panel>
            <Panel accent>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <TrendingUp size={12} />
                Approved
              </div>
              <div className="mt-2 text-3xl font-semibold text-emerald-300">{data.total_approved}</div>
            </Panel>
            <Panel>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <Clock size={12} />
                In Review
              </div>
              <div className="mt-2 text-3xl font-semibold text-yellow-300">{data.total_pending}</div>
            </Panel>
            <Panel>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <RefreshCw size={12} />
                Needs Revision
              </div>
              <div className="mt-2 text-3xl font-semibold text-orange-300">{data.total_needs_revision}</div>
            </Panel>
          </div>

          {/* Approval Rate + Points row */}
          <div className="mt-4 grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Approval Rate</div>
              <div className="mt-2 text-3xl font-semibold text-white">{data.approval_rate}%</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${data.approval_rate}%` }}
                />
              </div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Rejected</div>
              <div className="mt-2 text-3xl font-semibold text-red-300">{data.total_rejected}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total Points</div>
              <div className="mt-2 text-3xl font-semibold text-white">{data.total_points}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Global Rank</div>
              <div className="mt-2 text-3xl font-semibold text-white">#{data.global_rank || "—"}</div>
              <div className="mt-1 text-xs text-zinc-500">{data.current_streak}🔥 day streak</div>
            </Panel>
          </div>

          {/* Activity Graph */}
          {data.activity_graph && (
            <div className="mt-6">
              <ActivityGraph data={data.activity_graph} theme="emerald" />
            </div>
          )}

          {/* Recent Submissions */}
          <div className="mt-8">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4">Recent Submissions</h2>
            {data.recent_questions.length === 0 ? (
              <Panel className="py-12 text-center">
                <XCircle size={32} className="mx-auto mb-3 text-zinc-600" />
                <p className="text-sm text-zinc-500">No questions submitted yet.</p>
                <Link
                  href="/teacher/questions/create"
                  className="mt-3 inline-block text-sm text-red-400 hover:text-red-300 transition"
                >
                  Create your first question →
                </Link>
              </Panel>
            ) : (
              <div className="space-y-2">
                {data.recent_questions.map((q) => (
                  <Link key={q.id} href={`/intern/questions`}>
                    <Panel className="p-3 hover:bg-white/[0.04] transition cursor-pointer">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white truncate block">{q.title}</span>
                          <span className="mt-0.5 text-xs text-zinc-500 truncate block">
                            {q.topic?.chapter?.section?.course?.name || "—"} → {q.topic?.chapter?.name} → {q.topic?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:block text-xs text-zinc-600">{q.difficulty}</span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[q.approval_status] || STATUS_COLORS.DRAFT}`}>
                            {STATUS_LABELS[q.approval_status] || q.approval_status}
                          </span>
                        </div>
                      </div>
                    </Panel>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Link href="/teacher/questions/create" className="group rounded-2xl border border-red-500/20 bg-red-500/5 p-4 transition hover:bg-red-500/10 block">
              <div className="text-sm font-medium text-red-300">Create Question</div>
              <p className="text-xs text-zinc-500 mt-1">Submit new content</p>
            </Link>
            <Link href="/intern/questions" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06] block">
              <div className="text-sm font-medium text-white">My Questions</div>
              <p className="text-xs text-zinc-500 mt-1">View all your submissions</p>
            </Link>
            <Link href="/intern/statistics" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06] block">
              <div className="text-sm font-medium text-white">Statistics</div>
              <p className="text-xs text-zinc-500 mt-1">Detailed performance</p>
            </Link>
            <Link href="/leaderboard" className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06] block">
              <div className="text-sm font-medium text-white">Leaderboard</div>
              <p className="text-xs text-zinc-500 mt-1">Compare with peers</p>
            </Link>
          </div>
        </>
      ) : (
        <Panel className="py-12 text-center">
          <p className="text-sm text-zinc-500">Could not load dashboard data. Please try again.</p>
        </Panel>
      )}
    </>
  );
}
