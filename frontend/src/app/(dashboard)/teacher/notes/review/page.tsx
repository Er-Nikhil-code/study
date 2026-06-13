"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { NotesService } from "@/services/notes.service";
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function ReviewNotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<any | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");

  const fetchNotes = async () => {
    try {
      const data = await NotesService.getPendingNotes();
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAction = async (status: "APPROVED" | "REJECTED") => {
    if (!activeNote) return;
    if (status === "REJECTED" && !rejectionNote.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    try {
      await NotesService.reviewNote(activeNote.id, { 
        status, 
        rejection_note: rejectionNote,
        content_html: editedContent !== activeNote.content_html ? editedContent : undefined
      });
      setActiveNote(null);
      setEditedContent("");
      setRejectionNote("");
      fetchNotes();
    } catch (err) {
      alert("Failed to review note.");
    }
  };

  const navItems = [
    { label: "Knight home", href: "/teacher" },
    { label: "Hierarchy", href: "/teacher/hierarchy" },
    { label: "Questions", href: "/teacher/questions" },
    { label: "Review Notes", href: "/teacher/notes/review" },
    { label: "Tests", href: "/teacher/tests" },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionTitle title="Notes Review Queue" subtitle="Approve or reject study materials submitted by Pawns" />
        <Link 
          href="/intern/notes/create" 
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition hover:bg-red-500 hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]"
        >
          Create Notes
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-zinc-500">Loading queue...</p>
      ) : (
        <div className="mt-8 flex flex-col md:flex-row gap-6">
          {/* Queue List */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            {notes.length === 0 ? (
              <Panel><p className="text-zinc-500">No notes pending review! 🎉</p></Panel>
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNote(note);
                    setEditedContent(note.content_html);
                    setRejectionNote("");
                  }}
                  className={`p-4 rounded-lg cursor-pointer border transition-colors ${activeNote?.id === note.id ? 'bg-red-900/20 border-red-500' : 'bg-zinc-900 border-white/5 hover:border-white/20'}`}
                >
                  <h3 className="font-semibold text-white">{note.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {note.topic.chapter.section.course.name} → {note.topic.chapter.name} → {note.topic.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">By Pawn ID: {note.created_by}</p>
                </div>
              ))
            )}
          </div>

          {/* Active Note View */}
          <div className="w-full md:w-2/3">
            {activeNote ? (
              <Panel className="h-full">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{activeNote.title}</h2>
                    <p className="text-sm text-zinc-400">
                      Topic: {activeNote.topic.chapter.section.course.name} → {activeNote.topic.chapter.name} → {activeNote.topic.name}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-zinc-300 mb-2">Edit Note Content</h3>
                  <RichTextEditor 
                    value={editedContent}
                    onChange={setEditedContent}
                  />
                </div>

                <div className="mt-6 border-t border-white/10 pt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Rejection Feedback (Required if rejecting)</label>
                    <textarea
                      rows={3}
                      value={rejectionNote}
                      onChange={e => setRejectionNote(e.target.value)}
                      className="block w-full rounded-md border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-red-500"
                      placeholder="Provide feedback or required changes..."
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button onClick={() => handleAction("APPROVED")} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg">
                      Approve & Publish
                    </button>
                    <button onClick={() => handleAction("REJECTED")} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg">
                      Reject & Send Back
                    </button>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel className="h-full flex items-center justify-center min-h-[500px]">
                <p className="text-zinc-500">Select a note from the queue to review it.</p>
              </Panel>
            )}
          </div>
        </div>
      )}
    </>
  );
}
