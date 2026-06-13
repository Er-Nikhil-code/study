"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TestsService } from "@/services/tests.service";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import { AlertTriangle, Clock, User, Check, Send } from "lucide-react";

type QuestionStatus = "not_visited" | "not_answered" | "answered" | "marked" | "answered_marked";

export default function ExamInterfacePage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const attemptId = params.attemptId as string;

  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  // States to track warrior actions
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});
  
  const examContainerRef = useRef<HTMLDivElement>(null);

  const { data: testData, isLoading } = useQuery({
    queryKey: ["test", testId, "attempt", attemptId],
    queryFn: async () => {
      // Get test details to know the questions
      const res = await TestsService.getById(testId);
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => TestsService.submitAttempt(attemptId),
    onSuccess: () => {
      // Exit full screen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
      router.replace(`/student/tests/${testId}/attempt/${attemptId}/result`);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Failed to submit test.");
    }
  });

  // Full Screen & Anti-Cheat
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Going back during test is not allowed. Complete the test first.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Enter full screen
    const enterFullScreen = async () => {
      if (examContainerRef.current) {
        try {
          await examContainerRef.current.requestFullscreen();
        } catch (err) {
          console.warn("Fullscreen API failed", err);
        }
      }
    };
    
    // Give DOM time to render before requesting full screen
    const timer = setTimeout(() => {
      enterFullScreen();
    }, 1000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimeout(timer);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (testData?.duration_minutes && timeLeft === null) {
      // Initialize timer
      setTimeLeft(testData.duration_minutes * 60);
    }

    if (timeLeft !== null && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0) {
      // Auto submit
      submitMutation.mutate();
    }
  }, [testData, timeLeft]);

  // Initial status setup
  useEffect(() => {
    if (testData?.test_questions && Object.keys(statuses).length === 0) {
      const initialStatuses: Record<string, QuestionStatus> = {};
      testData.test_questions.forEach((tq: any, idx: number) => {
        initialStatuses[tq.id] = idx === 0 ? "not_answered" : "not_visited";
      });
      setStatuses(initialStatuses);
    }
  }, [testData]);

  if (isLoading || !testData) {
    return <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">Loading Exam Engine...</div>;
  }

  const questions = testData.test_questions || [];
  const currentQ = questions[activeQuestionIdx];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const saveResponseToBackend = async (tqId: string, ans: any, marked: boolean) => {
    try {
      let answerJson = {};
      if (ans !== null && ans !== undefined) {
        if (Array.isArray(ans)) {
          answerJson = { correct_options: ans };
        } else {
          answerJson = { correct_option: ans };
        }
      }

      await TestsService.saveAnswer(attemptId, {
        test_question_id: tqId,
        question_id: questions.find((q:any) => q.id === tqId)?.question_id,
        topic_id: testData.topic_id,
        answer_json: answerJson,
        marked_for_review: marked
      });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  const handleNavigate = async (newIdx: number) => {
    if (newIdx < 0 || newIdx >= questions.length) return;
    
    // Mark current as not_answered if it was not_visited or untouched
    const currentTqId = currentQ.id;
    const currentStatus = statuses[currentTqId];
    
    if (currentStatus === "not_visited") {
      setStatuses(prev => ({ ...prev, [currentTqId]: "not_answered" }));
    }

    // Mark next as not_answered if it was not_visited
    const nextTqId = questions[newIdx].id;
    if (statuses[nextTqId] === "not_visited" || !statuses[nextTqId]) {
      setStatuses(prev => ({ ...prev, [nextTqId]: "not_answered" }));
    }

    setActiveQuestionIdx(newIdx);
  };

  const handleSaveAndNext = async () => {
    const tqId = currentQ.id;
    const ans = answers[tqId];
    
    const newStatus = ans ? "answered" : "not_answered";
    setStatuses(prev => ({ ...prev, [tqId]: newStatus }));
    
    await saveResponseToBackend(tqId, ans, false);
    handleNavigate(activeQuestionIdx + 1);
  };

  const handleMarkReviewAndNext = async () => {
    const tqId = currentQ.id;
    const ans = answers[tqId];
    
    const newStatus = ans ? "answered_marked" : "marked";
    setStatuses(prev => ({ ...prev, [tqId]: newStatus }));
    
    await saveResponseToBackend(tqId, ans, true);
    handleNavigate(activeQuestionIdx + 1);
  };

  const handleClearResponse = async () => {
    const tqId = currentQ.id;
    setAnswers(prev => {
      const newAns = { ...prev };
      delete newAns[tqId];
      return newAns;
    });
    setStatuses(prev => ({ ...prev, [tqId]: "not_answered" }));
    await saveResponseToBackend(tqId, null, false);
  };

  const handleOptionSelect = (optionId: string) => {
    const tqId = currentQ.id;
    const isMulti = currentQ.question?.type === "MULTIPLE_CORRECT" || currentQ.question?.question_type === "MULTIPLE_CORRECT";
    
    setAnswers(prev => {
      if (isMulti) {
        const currentAns = Array.isArray(prev[tqId]) ? prev[tqId] : [];
        if (currentAns.includes(optionId)) {
          const newAns = currentAns.filter((id: string) => id !== optionId);
          return { ...prev, [tqId]: newAns.length > 0 ? newAns : null };
        } else {
          return { ...prev, [tqId]: [...currentAns, optionId] };
        }
      } else {
        return { ...prev, [tqId]: optionId };
      }
    });
    // We do NOT change status immediately until they hit Save & Next.
    // However, if they just click the palette to navigate away, it won't be saved unless we auto-save.
    // To match TCS iON, answers are only locked in when clicking "Save & Next" or "Mark for Review & Next".
  };

  const getStatusColor = (status: QuestionStatus) => {
    switch(status) {
      case "not_visited": return "bg-zinc-200 text-zinc-800 border-zinc-300";
      case "not_answered": return "bg-red-500 text-white rounded-b-lg border-red-600";
      case "answered": return "bg-emerald-500 text-white rounded-t-lg border-emerald-600";
      case "marked": return "bg-purple-600 text-white rounded-full border-purple-700";
      case "answered_marked": return "bg-purple-600 text-white rounded-full border-purple-700 relative";
      default: return "bg-zinc-200 text-zinc-800";
    }
  };

  const statCounts = {
    answered: Object.values(statuses).filter(s => s === "answered").length,
    not_answered: Object.values(statuses).filter(s => s === "not_answered").length,
    not_visited: Object.values(statuses).filter(s => s === "not_visited").length,
    marked: Object.values(statuses).filter(s => s === "marked").length,
    answered_marked: Object.values(statuses).filter(s => s === "answered_marked").length,
  };

  return (
    <div ref={examContainerRef} className="fixed inset-0 z-[100] flex flex-col bg-white text-zinc-900 select-none overflow-hidden">
      
      {/* Header */}
      <header className="h-16 bg-zinc-900 text-white flex items-center justify-between px-6 shrink-0 border-b border-zinc-800 shadow-sm">
        <div className="font-bold text-xl tracking-tight text-red-500 flex items-center gap-2">
          {testData.title}
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 bg-zinc-800/80 px-4 py-2 rounded-lg border border-zinc-700">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">Time Left:</span>
            <span className={`text-lg font-bold font-mono tracking-wider ${timeLeft !== null && timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center border border-zinc-600">
              <User className="w-5 h-5 text-zinc-300" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-bold">Candidate</div>
              <div className="text-xs text-zinc-400">Exam Session Active</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden bg-zinc-100">
        
        {/* Left Content Area */}
        <div className="flex-1 flex flex-col min-w-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-10 border-r border-zinc-300 bg-white">
          
          {/* Question Header */}
          <div className="h-14 bg-blue-600 text-white flex items-center justify-between px-6 shrink-0">
            <div className="font-bold text-lg">Question No. {activeQuestionIdx + 1}</div>
            <div className="flex items-center gap-4 text-sm font-medium">
              <span>Marks: <span className="text-emerald-300">+{currentQ?.marks_override || currentQ?.question?.marks}</span> | <span className="text-red-300">-{currentQ?.question?.negative_marks}</span></span>
              <div className="w-px h-4 bg-blue-400/50"></div>
              <span>View In: <select className="bg-white text-zinc-900 text-xs px-2 py-0.5 rounded outline-none border-none"><option>English</option></select></span>
            </div>
          </div>

          {/* Question Body */}
          <div className="flex-1 overflow-y-auto p-8 relative">
            <div className="absolute top-8 right-8 text-xs font-mono text-zinc-300">ID: {currentQ?.question?.id?.split('-')[0]}</div>
            
            <div className="text-lg font-medium text-zinc-800 mb-8 max-w-4xl leading-relaxed">
              <ContentBlockRenderer blocks={currentQ?.question?.content_json || []} />
            </div>

            <div className="space-y-3 max-w-2xl">
              {currentQ?.question?.options_json?.options?.map((opt: any) => {
                const isMulti = currentQ.question?.type === "MULTIPLE_CORRECT" || currentQ.question?.question_type === "MULTIPLE_CORRECT";
                const isSelected = isMulti 
                  ? (Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(opt.id))
                  : answers[currentQ.id] === opt.id;
                  
                return (
                  <label 
                    key={opt.id} 
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-zinc-200 hover:border-blue-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input 
                        type={isMulti ? "checkbox" : "radio"} 
                        name={`q_${currentQ.id}`} 
                        checked={isSelected}
                        onChange={() => handleOptionSelect(opt.id)}
                        className="peer sr-only"
                      />
                      <div className={`w-5 h-5 flex items-center justify-center transition-all ${isMulti ? 'rounded' : 'rounded-full'} border-2 ${isSelected ? 'border-blue-600' : 'border-zinc-400'}`}>
                        {isSelected && (
                          isMulti 
                            ? <Check className="w-3.5 h-3.5 text-blue-600 font-bold" />
                            : <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                        )}
                      </div>
                    </div>
                    <div className="text-zinc-800 text-base">{opt.text}</div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div className="h-16 bg-zinc-50 border-t border-zinc-200 px-6 shrink-0 flex items-center justify-between">
            <div className="flex gap-3">
              <button 
                onClick={handleMarkReviewAndNext}
                className="px-6 py-2 bg-white border border-zinc-300 rounded shadow-sm hover:bg-zinc-100 text-sm font-medium text-zinc-700 transition"
              >
                Mark for Review & Next
              </button>
              <button 
                onClick={handleClearResponse}
                className="px-6 py-2 bg-white border border-zinc-300 rounded shadow-sm hover:bg-zinc-100 text-sm font-medium text-zinc-700 transition"
              >
                Clear Response
              </button>
            </div>
            
            <button 
              onClick={handleSaveAndNext}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-md text-sm font-bold transition flex items-center gap-2"
            >
              Save & Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Palette Area */}
        <div className="w-80 flex flex-col shrink-0 bg-white border-l border-zinc-200 z-0">
          
          {/* Legend */}
          <div className="p-4 grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex items-center gap-2"><div className="w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded-t font-bold shadow-sm">{statCounts.answered}</div> <span className="text-zinc-600">Answered</span></div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-b font-bold shadow-sm">{statCounts.not_answered}</div> <span className="text-zinc-600">Not Answered</span></div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 flex items-center justify-center bg-zinc-200 text-zinc-800 rounded font-bold shadow-sm border border-zinc-300">{statCounts.not_visited}</div> <span className="text-zinc-600">Not Visited</span></div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold shadow-sm">{statCounts.marked}</div> <span className="text-zinc-600">Marked</span></div>
            <div className="flex items-center gap-2 col-span-2 mt-1">
              <div className="w-6 h-6 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold shadow-sm relative">
                {statCounts.answered_marked}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              </div> 
              <span className="text-zinc-600">Answered & Marked for Review (will be considered for evaluation)</span>
            </div>
          </div>

          <div className="h-8 bg-blue-500 text-white flex items-center px-4 text-sm font-bold shadow-inner">
            {testData.topic?.name}
          </div>

          {/* Question Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-blue-50/30">
            <div className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Choose a Question</div>
            <div className="grid grid-cols-4 gap-3">
              {questions.map((tq: any, idx: number) => {
                const status = statuses[tq.id] || "not_visited";
                const isCurrent = activeQuestionIdx === idx;
                
                return (
                  <button
                    key={tq.id}
                    onClick={() => handleNavigate(idx)}
                    className={`w-full aspect-square flex items-center justify-center text-sm font-bold shadow-sm transition hover:scale-105 ${getStatusColor(status)} ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  >
                    {idx + 1}
                    {status === "answered_marked" && (
                      <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50">
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to submit the test? You cannot change your answers after submission.")) {
                  submitMutation.mutate();
                }
              }}
              disabled={submitMutation.isPending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitMutation.isPending ? "Submitting..." : (
                <>
                  <Send className="w-4 h-4" /> Submit Test
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper icon component since we are using lucide-react but might not have imported it at the top
function ChevronRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
}
