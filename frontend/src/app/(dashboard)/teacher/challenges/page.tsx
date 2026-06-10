"use client";

import { useEffect, useState } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { ChallengesService } from "@/services/challenges.service";

export default function TeacherChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; action: string } | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

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

  const handleResolve = async (
    id: string,
    action: "ACCEPT" | "REJECT" | "ESCALATE" | "FORWARD_TO_INTERN",
    note?: string,
  ) => {
    setProcessingId(id);
    try {
      await ChallengesService.resolveChallenge(id, {
        action,
        resolution_note: note || `Resolved via quick action: ${action}`,
      });
      await fetchChallenges();
      setNoteModal(null);
      setResolutionNote("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to resolve challenge");
    } finally {
      setProcessingId(null);
    }
  };

  const openNoteModal = (id: string, action: string) => {
    setNoteModal({ id, action });
    setResolutionNote("");
  };

  return (
    <>
      <SectionTitle
        title="Challenges"
        subtitle="Review student challenge submissions. You can resolve them, reject, or forward to the intern who created the question."
      />

      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Panel key={i} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 w-full max-w-sm">
                    <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                    <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded-full bg-white/10 shrink-0" />
                </div>
              </Panel>
            ))}
          </div>
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
                    {challenge.question?.title || "Unknown Question"}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Submitted by: {challenge.created_by?.first_name || challenge.created_by?.email || "Student"}
                  </p>
                </div>

                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium shrink-0",
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
                  Reason: {challenge.reason?.replace(/_/g, " ")}
                </div>
                <div className="mt-2 text-sm text-zinc-200">
                  {challenge.description}
                </div>
              </div>

              {challenge.status === "PENDING" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleResolve(challenge.id, "ACCEPT")}
                    disabled={processingId === challenge.id}
                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15 disabled:opacity-50"
                  >
                    {processingId === challenge.id ? "..." : "Accept & Fix"}
                  </button>
                  <button
                    onClick={() => openNoteModal(challenge.id, "REJECT")}
                    disabled={processingId === challenge.id}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openNoteModal(challenge.id, "FORWARD_TO_INTERN")}
                    disabled={processingId === challenge.id}
                    className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/15 disabled:opacity-50"
                  >
                    Forward to Intern
                  </button>
                  <button
                    onClick={() => handleResolve(challenge.id, "ESCALATE")}
                    disabled={processingId === challenge.id}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06] disabled:opacity-50"
                  >
                    Escalate
                  </button>
                </div>
              )}
            </Panel>
          ))
        )}
      </div>

      {/* Resolution note modal */}
      {noteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setNoteModal(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-1">
              {noteModal.action === "FORWARD_TO_INTERN" ? "Forward to Intern" : "Reject Challenge"}
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              {noteModal.action === "FORWARD_TO_INTERN"
                ? "Add instructions for the intern who created this question."
                : "Explain why you're rejecting this challenge. The student will be notified."
              }
            </p>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder={noteModal.action === "FORWARD_TO_INTERN" ? "Instructions for intern..." : "Reason for rejection..."}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setNoteModal(null)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(noteModal.id, noteModal.action as any, resolutionNote)}
                disabled={processingId === noteModal.id}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {processingId === noteModal.id ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
