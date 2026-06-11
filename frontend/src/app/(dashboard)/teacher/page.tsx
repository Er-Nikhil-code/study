"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import studentService from "@/services/student.service";
import { useAuthStore } from "@/store/auth.store";
import { Users, FileQuestion, ClipboardCheck, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import ActivityGraph from "@/components/ui/ActivityGraph";
import ChessPiece3D from "@/components/ui/ChessPiece3D";

const CHALLENGE_STATUS_STYLES: Record<string, string> = {
  PENDING: "border-red-500/20 bg-red-500/10 text-red-300",
  RESOLVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  REJECTED: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
  ESCALATED: "border-orange-500/20 bg-orange-500/10 text-orange-300",
};

const APPROVAL_ICONS: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle size={14} className="text-emerald-400" />,
  REJECTED: <XCircle size={14} className="text-red-400" />,
  NEEDS_REVISION: <AlertCircle size={14} className="text-orange-400" />,
};

export default function TeacherHomePage() {
  const { user } = useAuthStore();

  const { data, isLoading: loading } = useQuery({
    queryKey: ["teacher", "dashboard"],
    queryFn: () => studentService.getTeacherDashboard(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  if (!user) return null;
  const firstName = (user as any).first_name || user?.firstName;
  const lastName = (user as any).last_name || user?.lastName;
  const name = firstName
    ? `${firstName}${lastName ? ` ${lastName}` : ""}`
    : user?.email?.split("@")[0] || "Knight";

  return (
    <>
      <div className="flex items-center justify-between gap-6 mb-8 bg-gradient-to-r from-red-500/10 to-transparent p-6 rounded-2xl relative min-h-[160px]">
        <div className="z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Knight Dashboard</h1>
          <p className="text-zinc-400">Welcome back, {name}. Here's your workflow overview.</p>
        </div>
        <div className="h-40 w-40 hidden sm:block shrink-0 z-10 absolute right-10 top-1/2 -translate-y-[40%]">
          <ChessPiece3D role="TEACHER" />
        </div>
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-[radial-gradient(ellipse_at_center,rgba(255,50,50,0.15)_0%,transparent_70%)] pointer-events-none" />
      </div>

      {/* Stats Grid — 2×3 symmetric */}
      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Panel accent>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <FileQuestion size={12} />
            Questions
          </div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.questions_created ?? 0}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Created by you</p>
        </Panel>
        <Panel>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <ClipboardCheck size={12} />
            Tests
          </div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.tests_created ?? 0}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Tests created</p>
        </Panel>
        <Panel>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <Users size={12} />
            Pawns
          </div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.students_assigned ?? 0}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Assigned to you</p>
        </Panel>
        <Panel accent={(data?.pending_challenges ?? 0) > 0}>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending Challenges</div>
          <div className="mt-2 text-3xl font-semibold text-red-300">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.pending_challenges ?? 0}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Awaiting review</p>
        </Panel>
        <Panel>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resolved</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.resolved_challenges ?? 0}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Challenges closed</p>
        </Panel>
        <Panel>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resolution Rate</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {loading ? (
              <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" />
            ) : data ? (
              (() => {
                const total = (data.pending_challenges ?? 0) + (data.resolved_challenges ?? 0);
                return total > 0 ? `${Math.round((data.resolved_challenges / total) * 100)}%` : "—";
              })()
            ) : "—"}
          </div>
          <p className="mt-1 text-xs text-zinc-500">Challenge resolution</p>
        </Panel>
      </div>

      {/* Activity Graph */}
      {data?.activity_graph && (
        <div className="mt-6">
          <ActivityGraph mixedData={data.activity_graph} theme="mixed" userName={name} />
        </div>
      )}

      {/* Two-column: Recent Challenges + Recent Reviews */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent challenges */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Recent Challenges</h3>
          {!data?.recent_challenges?.length ? (
            <Panel className="py-8 text-center">
              <CheckCircle size={24} className="mx-auto mb-2 text-emerald-500/50" />
              <p className="text-sm text-zinc-500">No pending challenges. 🎉</p>
            </Panel>
          ) : (
            <div className="space-y-2">
              {data.recent_challenges.map((c: any) => (
                <Panel key={c.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-white truncate block">{c.question?.title || "Unknown question"}</span>
                      <span className="text-xs text-zinc-500 capitalize">{c.reason?.toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${CHALLENGE_STATUS_STYLES[c.status] || CHALLENGE_STATUS_STYLES.PENDING}`}>
                      {c.status}
                    </span>
                  </div>
                </Panel>
              ))}
              <Link href="/teacher/challenges" className="block text-center text-xs text-zinc-500 hover:text-white transition pt-1">
                View all challenges →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Recent Question Reviews</h3>
          {!data?.recent_reviews?.length ? (
            <Panel className="py-8 text-center">
              <p className="text-sm text-zinc-500">No recent reviews yet.</p>
            </Panel>
          ) : (
            <div className="space-y-2">
              {data.recent_reviews.map((q: any) => (
                <Panel key={q.id} className="p-3">
                  <div className="flex items-center gap-3">
                    {APPROVAL_ICONS[q.approval_status]}
                    <span className="text-sm text-white truncate flex-1">{q.title}</span>
                    <span className="text-xs text-zinc-600 shrink-0">
                      {new Date(q.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </Panel>
              ))}
              <Link href="/teacher/questions/review" className="block text-center text-xs text-zinc-500 hover:text-white transition pt-1">
                Review pending questions →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/teacher/questions" className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
          <FileQuestion size={14} />
          Question Bank
        </Link>
        <Link href="/teacher/tests" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
          <ClipboardCheck size={14} />
          Manage Tests
        </Link>
        <Link href="/teacher/challenges" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
          <AlertCircle size={14} />
          Review Challenges
        </Link>
        <Link href="/teacher/questions/review" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
          <CheckCircle size={14} />
          Approve Questions
        </Link>
      </div>
    </>
  );
}
