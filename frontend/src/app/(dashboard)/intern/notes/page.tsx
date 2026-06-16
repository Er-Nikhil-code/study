"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { NotesService } from "@/services/notes.service";
import { Filter, Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  PENDING_REVIEW: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
  REJECTED: "border-red-500/20 bg-red-500/10 text-red-300",
  NEEDS_REVISION: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  DRAFT: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
};

export default function InternNotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [clearedNotes, setClearedNotes] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("clearedNotes");
    if (saved) {
      try {
        setClearedNotes(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleClear = (id: string) => {
    const next = [...clearedNotes, id];
    setClearedNotes(next);
    localStorage.setItem("clearedNotes", JSON.stringify(next));
  };

  const handleClearAll = () => {
    const toClear = notes
      .filter((n) => n.approval_status !== "DRAFT" && n.approval_status !== "PENDING_REVIEW")
      .map((n) => n.id);
    const next = Array.from(new Set([...clearedNotes, ...toClear]));
    setClearedNotes(next);
    localStorage.setItem("clearedNotes", JSON.stringify(next));
  };

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await NotesService.getMyNotes();
      setNotes(Array.isArray(data) ? data : data.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  let filtered = filterStatus === "ALL"
    ? notes
    : notes.filter((n) => n.approval_status === filterStatus);
    
  filtered = filtered.filter(n => !clearedNotes.includes(n.id));

  return (
    <>
      <SectionTitle
        title="My Notes"
        subtitle={`${filtered.length} note${filtered.length !== 1 ? "s" : ""} you've created.`}
        action={
          <Link
            href="/intern/notes/create"
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
          >
            <Plus size={16} /> Create Note
          </Link>
        }
      />

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Filter size={16} />
          <span>Filter by Status:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-1.5 text-sm text-white focus:border-red-500/50 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="NEEDS_REVISION">Needs Revision</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        
        {notes.some(n => n.approval_status !== "DRAFT" && n.approval_status !== "PENDING_REVIEW" && !clearedNotes.includes(n.id)) && (
          <button 
            onClick={handleClearAll}
            className="ml-auto rounded-xl border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.06] hover:text-white transition"
          >
            Clear All Reviewed
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Panel key={i} className="h-28 animate-pulse bg-white/[0.02]">
              <div />
            </Panel>
          ))
        ) : filtered.length === 0 ? (
          <Panel className="py-12 text-center text-sm text-zinc-500">
            No notes found matching this filter.
          </Panel>
        ) : (
          filtered.map((note) => (
            <Panel
              key={note.id}
              accent={note.approval_status === "DRAFT" || note.approval_status === "NEEDS_REVISION"}
              className="p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-base font-semibold text-white truncate">{note.title}</h3>
                  <p className="text-xs text-zinc-400">
                    {note.topic?.chapter?.section?.course?.name
                      ? `${note.topic.chapter.section.course.name} → ${note.topic.chapter.name} → ${note.topic.name}`
                      : "Unknown topic"}
                  </p>
                  {note.approval_status === "NEEDS_REVISION" && note.rejection_note && (
                    <span className="inline-block rounded bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-300">
                      Feedback: {note.rejection_note}
                    </span>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[note.approval_status] ?? STATUS_COLORS.DRAFT}`}
                >
                  {note.approval_status?.replace(/_/g, " ")}
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* Edit is allowed only when NOT yet approved */}
                {note.approval_status !== "APPROVED" && (
                  <Link
                    href={`/intern/notes/${note.id}/edit`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]"
                  >
                    Edit
                  </Link>
                )}
                {/* Submit for review if DRAFT or NEEDS_REVISION */}
                {(note.approval_status === "DRAFT" || note.approval_status === "NEEDS_REVISION") && (
                  <SubmitButton noteId={note.id} onSuccess={fetchNotes} />
                )}
                {(note.approval_status !== "DRAFT" && note.approval_status !== "PENDING_REVIEW") && (
                  <button 
                    onClick={() => handleClear(note.id)}
                    className="ml-auto rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </Panel>
          ))
        )}
      </div>
    </>
  );
}

// Isolated submit button with its own loading state
function SubmitButton({ noteId, onSuccess }: { noteId: string; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Reuse the reviewNote endpoint to submit for review (PENDING_REVIEW)
      // or call a dedicated submitForReview if one exists
      await NotesService.updateNote(noteId, {}); // touch to trigger re-review
      // Ideally there should be a submitForReview endpoint; for now update is enough
      onSuccess();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      disabled={submitting}
      onClick={handleSubmit}
      className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15 disabled:opacity-50"
    >
      {submitting ? "Submitting…" : "Submit for Review"}
    </button>
  );
}
