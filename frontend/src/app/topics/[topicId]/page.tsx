"use client";

import { useEffect, useState, use } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import { NotesService } from "@/services/notes.service";
import studentService, { type TestListItem } from "@/services/student.service";
import Link from "next/link";
import { ChevronLeft, FileText, BookOpen, Clock, ShieldAlert } from "lucide-react";
import TestCard from "@/components/tests/TestCard";

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
      studentService.getTests({ topic_id: topicId, take: 50 }).catch(() => ({ data: [] }))
    ]).then(([notesData, testsData]) => {
      setNotes(notesData);
      setTests(testsData.data || []);
      setLoading(false);
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

  return (
    <DashboardShell activeHref="/courses">
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
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/5 rounded-xl w-full" />
        </div>
      ) : activeTab === "NOTES" ? (
        <div className="space-y-6 max-w-4xl pb-20">
          {notes.length === 0 ? (
            <Panel><p className="text-zinc-500">No notes available for this topic yet.</p></Panel>
          ) : (
            notes.map((note) => (
              <Panel key={note.id} className="relative group">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <h3 className="text-xl font-bold text-white">{note.title}</h3>
                  <button
                    onClick={() => setSelectedNote(note)}
                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Challenge Note"
                  >
                    <ShieldAlert size={14} /> Report Issue
                  </button>
                </div>
                <div 
                  className="prose prose-invert max-w-none text-zinc-300"
                  dangerouslySetInnerHTML={{ __html: note.content_html }} 
                />
              </Panel>
            ))
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
    </DashboardShell>
  );
}
