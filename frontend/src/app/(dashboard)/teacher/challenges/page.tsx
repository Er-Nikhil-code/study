"use client";

import { useEffect, useState } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { ChallengesService } from "@/services/challenges.service";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { Edit2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function TeacherChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [noteModal, setNoteModal] = useState<{ id: string; action: string; question?: any } | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  
  // Escalation specific state
  const [escalationTargets, setEscalationTargets] = useState<{ interns: any[], admins: any[] }>({ interns: [], admins: [] });
  const [selectedTargetId, setSelectedTargetId] = useState("");

  // Revise Content specific state
  const [revisedContent, setRevisedContent] = useState<any>(null);

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

  const fetchEscalationTargets = async () => {
    try {
      const data = await ChallengesService.getEscalationTargets();
      setEscalationTargets(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchEscalationTargets();
  }, []);

  const handleResolve = async (
    id: string,
    action: "ACCEPT" | "REJECT" | "ESCALATE" | "FORWARD_TO_INTERN" | "REVISE_CONTENT",
    note?: string,
  ) => {
    if (action === "ESCALATE" && !selectedTargetId && noteModal?.action === "ESCALATE") {
      alert("Please select a target user to escalate to.");
      return;
    }

    setProcessingId(id);
    try {
      const payload: any = {
        action,
        resolution_note: note || `Resolved via quick action: ${action}`,
      };

      if (action === "ESCALATE") {
        payload.forward_to_user_id = selectedTargetId;
      }
      
      if (action === "REVISE_CONTENT" && revisedContent) {
        payload.revised_content_json = revisedContent;
      }

      // Optimistic UI update
      const previousChallenges = [...challenges];
      let optimisticStatus = "RESOLVED";
      if (action === "REJECT") optimisticStatus = "REJECTED";
      if (action === "ESCALATE") optimisticStatus = "ESCALATED";

      setChallenges((prev) => 
        prev.map(c => c.id === id ? { ...c, status: optimisticStatus } : c)
      );
      setNoteModal(null);
      setResolutionNote("");
      setSelectedTargetId("");
      setRevisedContent(null);

      await ChallengesService.resolveChallenge(id, payload);
      // Re-fetch in background to ensure full sync
      fetchChallenges();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to resolve challenge");
      // Revert on failure
      fetchChallenges();
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (id: string, action: string, question?: any) => {
    setNoteModal({ id, action, question });
    setResolutionNote("");
    setSelectedTargetId("");
    if (action === "REVISE_CONTENT" && question) {
      setRevisedContent(question.content_json);
    } else {
      setRevisedContent(null);
    }
  };

  return (
    <>
      <SectionTitle
        title="Challenges"
        subtitle="Review student challenge submissions. You can resolve them, revise content directly, reject, or escalate to interns/admins."
      />

      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Panel key={i} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 w-full max-w-sm">
                    <div className="h-3 w-16 hidden rounded bg-white/10" />
                    <div className="h-5 w-48 hidden rounded bg-white/10" />
                    <div className="h-4 w-32 hidden rounded bg-white/10" />
                  </div>
                  <div className="h-6 w-20 hidden rounded-full bg-white/10 shrink-0" />
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
                    {challenge.id}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white flex items-center gap-2">
                    {challenge.question?.title || "Unknown Question"}
                    {challenge.question && (
                      <Link href={`/admin/questions`} target="_blank" className="text-zinc-500 hover:text-white transition">
                        <ExternalLink size={14} />
                      </Link>
                    )}
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
                    {processingId === challenge.id ? "..." : "Accept (No Edits)"}
                  </button>
                  <button
                    onClick={() => openModal(challenge.id, "REVISE_CONTENT", challenge.question)}
                    disabled={processingId === challenge.id}
                    className="rounded-full flex items-center gap-2 border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 transition hover:bg-purple-500/15 disabled:opacity-50"
                  >
                    <Edit2 size={14} /> Accept & Edit Question
                  </button>
                  <button
                    onClick={() => openModal(challenge.id, "REJECT")}
                    disabled={processingId === challenge.id}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openModal(challenge.id, "ESCALATE")}
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

      {/* Action Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setNoteModal(null)}>
          <div
            className={`w-full ${noteModal.action === "REVISE_CONTENT" ? "max-w-4xl" : "max-w-md"} rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl my-8`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-1">
              {noteModal.action === "REJECT" ? "Reject Challenge" : 
               noteModal.action === "ESCALATE" ? "Escalate Challenge" : 
               "Accept & Edit Question"}
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              {noteModal.action === "REJECT" ? "Explain why you're rejecting this challenge. The student will be notified." :
               noteModal.action === "ESCALATE" ? "Select an Admin or your assigned Pawn to forward this to." :
               "Edit the question content directly to fix the issue identified in the challenge."}
            </p>

            {noteModal.action === "ESCALATE" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Escalate To</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-red-500/50"
                >
                  <option value="">-- Select User --</option>
                  {escalationTargets.admins.length > 0 && (
                    <optgroup label="Admins">
                      {escalationTargets.admins.map(a => (
                        <option key={a.id} value={a.id}>{a.first_name || a.email} (Admin)</option>
                      ))}
                    </optgroup>
                  )}
                  {escalationTargets.interns.length > 0 && (
                    <optgroup label="Your Pawns">
                      {escalationTargets.interns.map(i => (
                        <option key={i.id} value={i.id}>{i.first_name || i.email} (Pawn)</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}

            {noteModal.action === "REVISE_CONTENT" && (
              <div className="mb-6 rounded-xl border border-white/10 overflow-hidden min-h-[400px] bg-white">
                <RichTextEditor
                  value={revisedContent}
                  onChange={setRevisedContent}
                  placeholder="Edit the question content..."
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Resolution Note (Optional)
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Message to include in the notification..."
                rows={noteModal.action === "REVISE_CONTENT" ? 2 : 4}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/50"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNoteModal(null)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(noteModal.id, noteModal.action as any, resolutionNote)}
                disabled={processingId === noteModal.id || (noteModal.action === "ESCALATE" && !selectedTargetId)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {processingId === noteModal.id ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
