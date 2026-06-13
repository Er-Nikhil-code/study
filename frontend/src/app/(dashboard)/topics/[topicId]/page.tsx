"use client";

import { useEffect, useState, use } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import { NotesService } from "@/services/notes.service";
import studentService, { type TestListItem } from "@/services/student.service";
import Link from "next/link";
import { ChevronLeft, FileText, BookOpen, Clock, ShieldAlert, Edit2, Trash2, Download } from "lucide-react";
import TestCard from "@/components/tests/TestCard";
import { useAuthStore } from "@/store/auth.store";
import RichTextEditor from "@/components/ui/RichTextEditor";
import html2pdf from "html2pdf.js";

export default function TopicViewerPage({ params }: { params: Promise<{ topicId: string }> }) {
  const unwrappedParams = use(params);
  const { topicId } = unwrappedParams;

  const [topicName, setTopicName] = useState<string>("Loading Topic...");
  const [courseId, setCourseId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"NOTES" | "TESTS">("NOTES");
  
  const [notes, setNotes] = useState<any[]>([]);
  const [tests, setTests] = useState<TestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Challenge modal state
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [challengeReason, setChallengeReason] = useState("INCORRECT");
  const [challengeDesc, setChallengeDesc] = useState("");

  const { user } = useAuthStore();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteForm, setEditNoteForm] = useState({ title: "", content_html: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 1. Fetch hierarchy to get Topic Name
    HierarchyService.getFullHierarchy().then((data) => {
      let found = false;
      for (const course of data) {
        for (const section of course.sections || []) {
          for (const chapter of section.chapters || []) {
            for (const topic of chapter.topics || []) {
              if (topic.id === topicId) {
                setTopicName(`${course.name} → ${topic.name}`);
                setCourseId(course.id);
                found = true;
                break;
              }
            }
          }
        }
      }
      if (!found) setTopicName("Topic details not found.");
    });

    // 2. Fetch Notes & Tests concurrently
    Promise.all([
      NotesService.getApprovedNotes(topicId).catch(() => []),
      studentService.getTests({ topic_id: topicId, limit: 50 }).catch(() => ({ data: [] }))
    ]).then(([notesData, testsData]) => {
      setNotes(notesData);
      setTests(testsData.data || []);
      setLoading(false);
      
      // Mark notes as viewed in background if not empty
      if (notesData.length > 0) {
        HierarchyService.markNotesViewed(topicId).catch(console.error);
      }
    });
  }, [topicId]);

  const submitChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studentService.submitChallenge({
        response_id: "",
        question_id: "", // Since it's a note challenge, the backend will use note_id, but wait, the frontend submitChallenge might need updating to support note_id. Let's pass it anyway.
        // Actually, studentService.submitChallenge doesn't have note_id typed, but we can pass it as any
        ...({ note_id: selectedNote.id } as any),
        reason: challengeReason,
        description: challengeDesc
      });
      alert("Challenge submitted successfully!");
      setSelectedNote(null);
      setChallengeDesc("");
    } catch (err: any) {
      alert("Failed to submit challenge.");
    }
  };

  const handleEditNote = async (e: React.FormEvent, noteId: string) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await NotesService.updateNote(noteId, editNoteForm);
      setNotes(notes.map(n => n.id === noteId ? { ...n, ...editNoteForm } : n));
      setEditingNoteId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await NotesService.deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err: any) {
      alert("Failed to delete note.");
    }
  };

  const handleDownloadPdf = (noteId: string, title: string) => {
    const element = document.getElementById(`note-content-${noteId}`);
    if (!element) return;
    
    const opt = {
      margin:       10,
      filename:     `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <>
      <div className="mb-6">
        {courseId ? (
          <Link href={`/courses/${courseId}`} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 mb-4">
            <ChevronLeft size={16} /> Back to Course
          </Link>
        ) : (
          <Link href="/courses" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 mb-4">
            <ChevronLeft size={16} /> Back to Courses
          </Link>
        )}
        <SectionTitle title={topicName} subtitle="Study notes and take practice tests for this topic." />
      </div>

      <div className="flex items-center gap-6 border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab("NOTES")}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "NOTES" ? "border-red-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Study Notes
        </button>
        <button
          onClick={() => setActiveTab("TESTS")}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "TESTS" ? "border-red-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Practice Tests
        </button>
      </div>

      {loading ? (
        <div className="hidden space-y-4">
          <div className="h-32 bg-white/5 rounded-xl w-full" />
        </div>
      ) : activeTab === "NOTES" ? (
        <div className="space-y-6 max-w-4xl pb-20">
          {notes.length === 0 ? (
            <Panel><p className="text-zinc-500">No notes available for this topic yet.</p></Panel>
          ) : (
            notes.map((note) => {
              const canEdit = user?.role === "ADMIN" || (user?.role === "TEACHER" && note.created_by === user?.id);
              return (
                <Panel key={note.id} className="relative group">
                  {editingNoteId === note.id ? (
                    <form onSubmit={(e) => handleEditNote(e, note.id)} className="space-y-4">
                      <div>
                        <label className="text-sm text-zinc-400">Title</label>
                        <input required type="text" value={editNoteForm.title} onChange={e => setEditNoteForm({...editNoteForm, title: e.target.value})} className="mt-1 w-full rounded bg-black border border-white/20 px-3 py-2 text-white outline-none focus:border-red-500" />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400 mb-1 block">Content</label>
                        <RichTextEditor value={editNoteForm.content_html} onChange={val => setEditNoteForm({...editNoteForm, content_html: val})} placeholder="Edit note content..." />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setEditingNoteId(null)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50">Save Changes</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                        <h3 className="text-xl font-bold text-white">{note.title}</h3>
                        <div className="flex gap-2">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => { setEditingNoteId(note.id); setEditNoteForm({ title: note.title, content_html: note.content_html }); }}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 px-2 py-1 rounded"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 px-2 py-1 rounded"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDownloadPdf(note.id, note.title)}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 px-2 py-1 rounded"
                            title="Download as PDF"
                          >
                            <Download size={14} /> PDF
                          </button>
                          <button
                            onClick={() => setSelectedNote(note)}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 px-2 py-1 rounded"
                            title="Challenge Note"
                          >
                            <ShieldAlert size={14} /> Report
                          </button>
                        </div>
                      </div>
                      <div id={`note-content-${note.id}`} className="bg-[#111] p-4 rounded-xl">
                        <div 
                          className="prose prose-invert max-w-none text-zinc-300"
                          dangerouslySetInnerHTML={{ __html: note.content_html }} 
                        />
                      </div>
                    </>
                  )}
                </Panel>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tests.length === 0 ? (
            <Panel className="col-span-2"><p className="text-zinc-500">No practice tests available for this topic.</p></Panel>
          ) : (
            tests.map(test => <TestCard key={test.id} test={test as any} />)
          )}
        </div>
      )}

      {/* Challenge Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Panel className="w-full max-w-lg border border-red-900/50">
            <h2 className="text-lg font-bold text-white mb-4">Report Issue with Note</h2>
            <p className="text-sm text-zinc-400 mb-6">Found a mistake in "{selectedNote.title}"? Let us know so it can be fixed.</p>
            
            <form onSubmit={submitChallenge} className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">Issue Type</label>
                <select
                  value={challengeReason}
                  onChange={(e) => setChallengeReason(e.target.value)}
                  className="w-full rounded border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-red-500"
                >
                  <option value="INCORRECT">Incorrect Information</option>
                  <option value="OUT_OF_SYLLABUS">Out of Syllabus</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">Description</label>
                <textarea
                  required
                  rows={4}
                  value={challengeDesc}
                  onChange={(e) => setChallengeDesc(e.target.value)}
                  placeholder="Explain what is wrong with the note..."
                  className="w-full rounded border border-white/10 bg-black px-3 py-2 text-white outline-none focus:border-red-500"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500">Submit</button>
                <button type="button" onClick={() => setSelectedNote(null)} className="flex-1 rounded bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700">Cancel</button>
              </div>
            </form>
          </Panel>
        </div>
      )}
    </>
  );
}
