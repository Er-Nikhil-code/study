"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { ChallengesService } from "@/services/challenges.service";

const navItems = [
  { label: "Teacher home", href: "/teacher" },
  { label: "Questions", href: "/teacher/questions" },
  { label: "Tests", href: "/teacher/tests" },
  { label: "Challenges", href: "/teacher/challenges" },
];

export default function TeacherChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchChallenges = async () => {
    try {
      const data = await ChallengesService.getAssignedChallenges();
      setChallenges(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleResolve = async (id: string, action: "ACCEPT" | "REJECT" | "ESCALATE") => {
    setProcessingId(id);
    try {
      await ChallengesService.resolveChallenge(id, { action, resolution_note: `Resolved via quick action: ${action}` });
      await fetchChallenges();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to resolve challenge");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardShell activeHref="/teacher/challenges">
      <SectionTitle
        title="Challenges"
        subtitle="Review student challenge submissions and resolve them from one place."
      />

      <div className="mt-6 grid gap-4">
        {loading ? (
          <p className="text-zinc-500">Loading challenges...</p>
        ) : challenges.length === 0 ? (
          <Panel><p className="text-zinc-500">No pending challenges assigned to you! 🎉</p></Panel>
        ) : (
          challenges.map((challenge) => (
            <Panel
              key={challenge.id}
              accent={challenge.status === "PENDING"}
              className="p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    {challenge.id.split("-")[0]}-{challenge.id.slice(-4)}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {challenge.student?.name || "Student"}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">Question ID: {challenge.question_id}</p>
                </div>

                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    challenge.status === "PENDING"
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                      : challenge.status === "RESOLVED"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/20 bg-red-500/10 text-red-200",
                  ].join(" ")}
                >
                  {challenge.status}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Reason: {challenge.reason.replace(/_/g, " ")}
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {challenge.description}
                </div>
              </div>

              {challenge.status === "PENDING" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => handleResolve(challenge.id, "ACCEPT")} disabled={processingId === challenge.id} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-50">
                    {processingId === challenge.id ? "..." : "Accept"}
                  </button>
                  <button onClick={() => handleResolve(challenge.id, "REJECT")} disabled={processingId === challenge.id} className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50">
                    {processingId === challenge.id ? "..." : "Reject"}
                  </button>
                  <button onClick={() => handleResolve(challenge.id, "ESCALATE")} disabled={processingId === challenge.id} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06] disabled:opacity-50">
                    Escalate
                  </button>
                </div>
              )}
            </Panel>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
