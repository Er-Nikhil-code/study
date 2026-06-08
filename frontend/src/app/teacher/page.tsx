"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import studentService, { type TeacherDashboard } from "@/services/student.service";

const navItems = [
  { label: "Teacher home", href: "/teacher" },
  { label: "Questions", href: "/teacher/questions" },
  { label: "Tests", href: "/teacher/tests" },
  { label: "Challenges", href: "/teacher/challenges" },
];

export default function TeacherHomePage() {
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService
      .getTeacherDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell activeHref="/teacher" navItems={navItems}>
      <SectionTitle title="Teacher Dashboard" subtitle="Central hub for question, test, and challenge workflows." />

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Panel accent>
          <div className="text-sm text-zinc-400">Questions</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.questions_created ?? 0}
          </div>
        </Panel>
        <Panel>
          <div className="text-sm text-zinc-400">Tests</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.tests_created ?? 0}
          </div>
        </Panel>
        <Panel accent={(data?.pending_challenges ?? 0) > 0}>
          <div className="text-sm text-zinc-400">Pending Challenges</div>
          <div className="mt-2 text-3xl font-semibold text-red-300">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.pending_challenges ?? 0}
          </div>
        </Panel>
        <Panel>
          <div className="text-sm text-zinc-400">Resolved</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded bg-white/10" /> : data?.resolved_challenges ?? 0}
          </div>
        </Panel>
      </div>

      {/* Recent challenges */}
      {data?.recent_challenges && data.recent_challenges.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Recent Challenges</h3>
          <div className="space-y-2">
            {data.recent_challenges.map((c: any) => (
              <Panel key={c.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white">{c.question?.title}</span>
                    <span className="ml-2 text-xs text-zinc-500">{c.reason}</span>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${
                    c.status === "PENDING" ? "border-red-500/20 bg-red-500/10 text-red-300"
                      : c.status === "RESOLVED" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/20 bg-red-500/10 text-red-300"
                  }`}>{c.status}</span>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/teacher/questions" className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
          Open Question Bank
        </Link>
        <Link href="/teacher/tests" className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
          Manage Tests
        </Link>
        <Link href="/teacher/challenges" className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
          Review Challenges
        </Link>
      </div>
    </DashboardShell>
  );
}
