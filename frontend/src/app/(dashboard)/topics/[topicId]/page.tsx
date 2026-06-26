"use client";

import { useEffect, useState, use } from "react";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import { NotesService } from "@/services/notes.service";
import AppLoader from "@/components/ui/AppLoader";
import { getSecureUrl } from "@/lib/secure-url";
import Link from "next/link";
import { ChevronLeft, FileText, Trash2, Download, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function TopicViewerPage({ params }: { params: Promise<{ topicId: string }> }) {
  const unwrappedParams = use(params);
  const { topicId } = unwrappedParams;

  const [topicName, setTopicName] = useState<string>("Loading Topic...");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();

  useEffect(() => {
    HierarchyService.getFullHierarchy().then((data) => {
      let found = false;
      for (const course of data) {
        for (const section of course.sections || []) {
          for (const chapter of section.chapters || []) {
            for (const topic of chapter.topics || []) {
              if (topic.id === topicId) {
                setTopicName(`${course.name} → ${topic.name}`);
                setCourseId(course.id);
                localStorage.setItem(`last_topic_${course.id}`, topic.id);
                found = true;
                break;
              }
            }
          }
        }
      }
      if (!found) setTopicName("Topic details not found.");
    });

    NotesService.getNotesByTopic(topicId).then((notesData) => {
      setNotes(notesData);
      setLoading(false);
      
      if (notesData.length > 0) {
        HierarchyService.markNotesViewed(topicId).catch(console.error);
      }
    }).catch(() => {
      setNotes([]);
      setLoading(false);
    });
  }, [topicId]);

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await NotesService.deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err: any) {
      alert("Failed to delete note.");
    }
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
        <SectionTitle title={topicName} subtitle="Study notes for this topic." />
      </div>

      {loading ? (
        <div className="hidden space-y-4">
          <div className="h-32 bg-white/5 rounded-xl w-full" />
        </div>
      ) : (
        <div className="space-y-6 max-w-5xl pb-20">
          {notes.length === 0 ? (
            <Panel><p className="text-zinc-500">No notes available for this topic yet.</p></Panel>
          ) : (
            notes.map((note) => {
              const canEdit = user?.role === "ADMIN" || (user?.role === "TEACHER" && note.created_by === user?.id);
              return (
                <Panel key={note.id} className="relative group p-0 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 p-4 bg-zinc-900/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText size={20} className="text-red-400" />
                      {note.title}
                    </h3>
                    <div className="flex gap-2">
                      <a
                        href={`/notes-viewer?url=${encodeURIComponent(getSecureUrl(note.pdf_url))}&title=${encodeURIComponent(note.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-blue-400 transition-opacity bg-white/5 px-3 py-1.5 rounded-lg font-medium"
                      >
                        <ExternalLink size={14} /> Open Dedicated Viewer
                      </a>
                      <a
                        href={getSecureUrl(note.pdf_url)}
                        download
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-opacity bg-white/5 px-3 py-1.5 rounded-lg font-medium"
                      >
                        <Download size={14} /> Download
                      </a>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-opacity bg-white/5 px-3 py-1.5 rounded-lg font-medium"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full bg-zinc-950 flex justify-center items-center p-8 border-t border-white/5">
                    {note.pdf_url ? (
                      <div className="flex flex-col items-center justify-center text-center">
                        <FileText size={48} className="text-zinc-600 mb-4" />
                        <p className="text-zinc-400 mb-4">View this note in our dedicated viewer with Night Mode support.</p>
                        <a 
                          href={`/notes-viewer?url=${encodeURIComponent(getSecureUrl(note.pdf_url))}&title=${encodeURIComponent(note.title)}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 font-medium shadow-lg shadow-red-900/20"
                        >
                          Open Notes Viewer
                        </a>
                      </div>
                    ) : (
                      <div className="text-center text-zinc-500">
                        Invalid PDF URL for this note.
                      </div>
                    )}
                  </div>
                </Panel>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
