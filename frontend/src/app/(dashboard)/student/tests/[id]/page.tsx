"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { TestsService } from "@/services/tests.service";
import { Clock, AlertTriangle, Play, BookOpen, ChevronRight, Hash } from "lucide-react";

export default function TestInstructionsPage() {
  const router = useRouter();
  const unwrappedParams = useParams();
  const testId = unwrappedParams.id as string;
  
  const [agreed, setAgreed] = useState(false);

  const { data: res, isLoading, error } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => TestsService.getById(testId),
  });

  const startMutation = useMutation({
    mutationFn: () => TestsService.startAttempt(testId),
    onSuccess: (data: any) => {
      const url = `/student/tests/${testId}/attempt/${data.id}`;
      // Replace location so they can't go back to the instructions
      window.location.replace(window.location.origin + url);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Failed to start test.");
    }
  });

  const test = res?.data;

  if (isLoading) return <div className="p-8 text-zinc-500">Loading instructions...</div>;
  if (error || !test) return <div className="p-8 text-red-400">Failed to load test details.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="mb-6">
        <button 
          onClick={() => router.push("/student/tests")}
          className="text-sm text-zinc-400 hover:text-white transition flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Tests
        </button>
      </div>

      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{test.title}</h1>
          <p className="text-zinc-400 mt-2">{test.topic?.name}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="block text-xs text-zinc-500 uppercase tracking-widest mb-1">Duration</span>
            <span className="text-xl font-bold text-white">{test.duration_minutes} Mins</span>
          </div>
          <div className="text-center">
            <span className="block text-xs text-zinc-500 uppercase tracking-widest mb-1">Max Marks</span>
            <span className="text-xl font-bold text-white">{test.total_marks}</span>
          </div>
        </div>
      </div>

      <Panel className="mb-8 border-yellow-500/30 bg-yellow-500/5">
        <h2 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> 
          Strict Anti-Cheat Environment
        </h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300">
          <li>The test will open in <strong>Full Screen Mode</strong>. Do not exit full screen.</li>
          <li>Navigation away from the test window, refreshing the page, or closing the tab is <strong>strictly prohibited</strong>.</li>
          <li>If you attempt to go back, you will receive a warning, and repeated violations may lead to automatic submission.</li>
          <li>Your answers are auto-saved securely. Ensure a stable internet connection.</li>
        </ul>
      </Panel>

      <Panel className="mb-8">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-red-400" /> 
          General Instructions
        </h2>
        
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
          <p>
            1. The clock has been set at the server and the countdown timer at the top right corner of your screen will display the time remaining for you to complete the exam. When the clock runs out, the exam ends by default - you are not required to end or submit your exam manually.
          </p>

          <div>
            <p className="mb-3">2. The question palette at the right of screen shows one of the following statuses of each of the questions numbered:</p>
            <ul className="space-y-3 ml-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-600 flex items-center justify-center text-white font-bold">1</div>
                <span>You have not visited the question yet.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-b-lg bg-red-500 flex items-center justify-center text-white font-bold">2</div>
                <span>You have not answered the question.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-t-lg bg-emerald-500 flex items-center justify-center text-white font-bold">3</div>
                <span>You have answered the question.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">4</div>
                <span>You have NOT answered the question but have marked the question for review.</span>
              </li>
              <li className="flex items-center gap-3 relative">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">5</div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="ml-2">You have answered the question but marked it for review.</span>
              </li>
            </ul>
          </div>

          <p className="italic text-zinc-400">
            The Marked for Review status simply acts as a reminder that you have set to look at the question again. If an answer is selected for a question that is Marked for Review, the answer will be considered in the final evaluation.
          </p>

          <p>
            3. Marking Scheme: <br/>
            - Positive Marks: <strong>+{test.positive_marks}</strong> for each correct answer.<br/>
            - Negative Marks: <strong>-{test.negative_marks}</strong> for each incorrect answer.<br/>
            - Unanswered questions will receive 0 marks.
          </p>
        </div>
      </Panel>

      <div className="flex flex-col items-center gap-6 mt-12 bg-black/40 p-8 rounded-2xl border border-white/5">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-6 h-6 border-2 border-zinc-600 rounded bg-transparent peer-checked:bg-red-500 peer-checked:border-red-500 transition-all flex items-center justify-center group-hover:border-red-400">
              {agreed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
          <span className="text-zinc-300 font-medium select-none group-hover:text-white transition">
            I have read and understood the instructions. I agree to not navigate away from the test window.
          </span>
        </label>

        <button
          disabled={!agreed || startMutation.isPending}
          onClick={() => {
            startMutation.mutate();
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-12 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-red-900/20"
        >
          {startMutation.isPending ? "Preparing Exam..." : (
            <>
              <Play className="w-5 h-5 fill-current" /> I am ready to begin
            </>
          )}
        </button>
      </div>
    </div>
  );
}
