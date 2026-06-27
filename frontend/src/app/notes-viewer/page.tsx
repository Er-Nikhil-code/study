"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Moon, Sun, Download, ArrowLeft, Flag, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";

function NotesViewerContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "Notes Viewer";
  const noteId = searchParams.get("noteId");
  
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("TYPO");
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteId) return;
    setIsReporting(true);
    try {
      await api.post("/challenges", {
        note_id: noteId,
        reason: reportReason,
        description: reportDescription,
      });
      toast.success("Note sent for review successfully.");
      setIsReportModalOpen(false);
      setReportDescription("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to send note for review");
    } finally {
      setIsReporting(false);
    }
  };

  // Read system preference or local storage for initial dark mode state
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    const saved = localStorage.getItem("notes-dark-mode");
    if (saved) {
      setDarkMode(saved === "true");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("notes-dark-mode", String(next));
      return next;
    });
  };

  if (!url) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">No PDF URL provided.</p>
      </div>
    );
  }

  return (
    <>
      {/* 2-second dark to light transition overlay to reduce eye strain */}
      <div className="pointer-events-none fixed inset-0 z-[9999] bg-[#050505] animate-[fadeOutOverlay_2s_ease-in-out_forwards]" />
      <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">
      {/* Tiny Header */}
      <header className="h-10 shrink-0 bg-black border-b border-white/10 px-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : window.close()}
            className="text-zinc-400 hover:text-white transition p-1 rounded hover:bg-white/5"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-sm font-medium text-zinc-300 truncate max-w-[300px] md:max-w-md">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDarkMode}
            className="text-zinc-400 hover:text-white transition p-1.5 rounded hover:bg-white/5"
            title={darkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className={`transition p-1.5 rounded hover:bg-white/5 ${noteId ? 'text-zinc-400 hover:text-red-400' : 'text-zinc-600 cursor-not-allowed hidden'}`}
            title="Send for Review"
            disabled={!noteId}
          >
            <Flag size={16} />
          </button>
          <a
            href={url}
            download
            className="text-zinc-400 hover:text-emerald-400 transition p-1.5 rounded hover:bg-white/5"
            title="Download Notes"
          >
            <Download size={16} />
          </a>
        </div>
      </header>

      {/* PDF Viewer Area */}
      <main className="flex-1 w-full bg-zinc-900 relative">
        {isMobile ? (
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
            className="absolute inset-0 w-full h-full border-none bg-white"
            title="PDF Mobile Viewer"
          />
        ) : (
          <object
            data={`${url}#toolbar=0&navpanes=0`}
            type="application/pdf"
            className="absolute inset-0 w-full h-full"
            style={{
              transition: "filter 2s ease-in-out",
              /* Invert colors and rotate hue to keep images roughly same color but flip background/text */
              filter: darkMode ? "invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)" : "none"
            }}
          >
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <p className="text-zinc-400 mb-4">Your browser does not support inline PDF viewing.</p>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 font-medium text-sm"
              >
                Click here to view PDF directly
              </a>
            </div>
          </object>
        )}

        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <h2 className="text-xl font-bold text-white mb-2">Send Note for Review</h2>
              <p className="text-sm text-zinc-400 mb-6">Found an issue in this note? Let us know so we can fix it.</p>
              
              <form onSubmit={handleReport} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Issue Type</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl bg-black border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                  >
                    <option value="TYPO">Typo or Spelling Mistake</option>
                    <option value="WRONG_EXPLANATION">Incorrect Information</option>
                    <option value="UNCLEAR_WORDING">Unclear Wording</option>
                    <option value="OTHER">Other Issue</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">Description</label>
                  <textarea 
                    required
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Please describe the issue in detail (e.g., 'On page 3, the formula for... is incorrect')"
                    className="w-full rounded-xl bg-black border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors min-h-[100px] resize-y"
                  />
                </div>
                
                <div className="flex items-center gap-3 mt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                    disabled={isReporting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReporting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                  >
                    {isReporting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}

export default function NotesViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <NotesViewerContent />
    </Suspense>
  );
}
