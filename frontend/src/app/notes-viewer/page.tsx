"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Moon, Sun, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

function NotesViewerContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const title = searchParams.get("title") || "Notes Viewer";
  const [darkMode, setDarkMode] = useState(false);

  // Read system preference or local storage for initial dark mode state
  useEffect(() => {
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
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950">
      {/* Tiny Header */}
      <header className="h-10 shrink-0 bg-black border-b border-white/10 px-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="text-zinc-400 hover:text-white transition p-1 rounded hover:bg-white/5"
            title="Close Note"
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
        <object
          data={url}
          type="application/pdf"
          className="absolute inset-0 w-full h-full transition-all duration-300"
          style={{
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
      </main>
    </div>
  );
}

export default function NotesViewerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <NotesViewerContent />
    </Suspense>
  );
}
