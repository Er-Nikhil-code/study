"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import studentService from "@/services/student.service";

export default function TestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.testId as string;

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    studentService
      .getTestDetails(testId)
      .then(setTest)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [testId]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const result = await studentService.startAttempt(testId);
      router.push(`/tests/${testId}/attempt?attemptId=${result.attempt.id}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to start test");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell activeHref="/tests">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-64 animate-pulse rounded-2xl bg-white/[0.03]" />
      </DashboardShell>
    );
  }

  if (!test) {
    return (
      <DashboardShell activeHref="/tests">
        <div className="text-center py-12">
          <p className="text-zinc-500">Test not found.</p>
          <Link href="/tests" className="mt-4 inline-block text-red-400 hover:text-red-300">
            ← Back to tests
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const questionCount = test._count?.test_questions ?? 0;
  const attemptCount = test._count?.attempts ?? 0;

  return (
    <DashboardShell activeHref="/tests">
        <SectionTitle
          title={test.title}
          subtitle={test.description || "Ready when you are."}
        />

        <Panel accent className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Duration</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {test.duration_minutes} min
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Questions</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {questionCount}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Total Marks</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {test.total_marks}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xs text-zinc-500">Attempts</div>
              <div className="mt-1 text-xl font-semibold text-white">
                {attemptCount}
              </div>
            </div>
          </div>

          {test.passing_marks && (
            <p className="mt-4 text-sm text-zinc-400">
              Passing marks: <span className="text-white font-medium">{test.passing_marks}</span>
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleStart}
              disabled={starting}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-6 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
            >
              {starting ? "Starting…" : "Start Attempt"}
            </button>
            <Link
              href="/tests"
              className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]"
            >
              Back to tests
            </Link>
          </div>
        </Panel>
    </DashboardShell>
  );
}
