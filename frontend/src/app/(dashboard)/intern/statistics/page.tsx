"use client";

import { useEffect, useState } from "react";
import studentService, { type TeacherDashboard } from "@/services/student.service";
import Panel from "@/components/ui/Panel";
import { useAuthStore } from "@/store/auth.store";

export default function InternStatisticsPage() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<TeacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      try {
        const data = await studentService.getTeacherDashboard();
        if (isMounted) setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch intern statistics", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  if (!user) return null;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Question Statistics</h1>
        <p className="text-sm text-zinc-500 mt-1">Review your content contributions and question statuses.</p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 hidden rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : dashboardData ? (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Panel accent>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Questions Created</div>
              <div className="mt-2 text-3xl font-semibold text-red-300">{dashboardData.questions_created || 0}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pending Challenges</div>
              <div className="mt-2 text-3xl font-semibold text-white">{dashboardData.pending_challenges || 0}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resolved Challenges</div>
              <div className="mt-2 text-3xl font-semibold text-white">{dashboardData.resolved_challenges || 0}</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tests Created</div>
              <div className="mt-2 text-3xl font-semibold text-white">{dashboardData.tests_created || 0}</div>
            </Panel>
          </div>
        </>
      ) : null}
    </>
  );
}
