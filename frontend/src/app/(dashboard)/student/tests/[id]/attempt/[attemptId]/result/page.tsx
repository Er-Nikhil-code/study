"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { TestsService } from "@/services/tests.service";
import { ChallengesService } from "@/services/challenges.service";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, Trophy, Target, Flag } from "lucide-react";

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;
  const attemptId = params.attemptId as string;

  const [challengeQid, setChallengeQid] = useState<string | null>(null);
  const [challengeReason, setChallengeReason] = useState("WRONG_ANSWER_KEY");
  const [challengeDesc, setChallengeDesc] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["test", testId, "attempt", attemptId, "result"],
    queryFn: () => TestsService.getAttemptResult(attemptId),
  });

  const challengeMutation = useMutation({
    mutationFn: (payload: any) => ChallengesService.create(payload),
    onSuccess: () => {
      alert("Challenge submitted successfully. Our Knights will review it.");
      setChallengeQid(null);
      setChallengeDesc("");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Failed to submit challenge.");
    }
  });

  const handleChallengeSubmit = (e: React.FormEvent, questionId: string, responseId: string) => {
    e.preventDefault();
    challengeMutation.mutate({
      question_id: questionId,
      response_id: responseId,
      reason: challengeReason,
      description: challengeDesc
    });
  };

  if (isLoading) return <div className="p-8 text-zinc-500">Loading results...</div>;
  if (!res?.data) return <div className="p-8 text-red-400">Failed to load results.</div>;

  const { attempt, test } = res.data;
  const responses = attempt.responses || [];

  const correct = responses.filter((r: any) => r.is_correct === true).length;
  const incorrect = responses.filter((r: any) => r.is_correct === false).length;
  const total = test.test_questions.length;
  const unattempted = total - correct - incorrect;
  
  const percentage = attempt.max_score ? Math.round((attempt.score / attempt.max_score) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push("/student/tests")}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <SectionTitle title="Test Analysis" subtitle={`Detailed performance report for ${test.title}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Panel className="flex flex-col items-center justify-center py-8 text-center border-emerald-500/30 bg-emerald-500/5">
          <Trophy className="w-8 h-8 text-emerald-400 mb-2" />
          <div className="text-3xl font-bold text-white">{attempt.score} <span className="text-sm text-zinc-500">/ {attempt.max_score}</span></div>
          <div className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Total Score</div>
        </Panel>
        
        <Panel className="flex flex-col items-center justify-center py-8 text-center border-blue-500/30 bg-blue-500/5">
          <Target className="w-8 h-8 text-blue-400 mb-2" />
          <div className="text-3xl font-bold text-white">{percentage}%</div>
          <div className="text-xs text-zinc-400 uppercase tracking-widest mt-1">Accuracy</div>
        </Panel>
        
        <Panel className="md:col-span-2 p-6 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{correct}</div>
            <div className="text-xs text-zinc-400 uppercase">Correct</div>
          </div>
          <div className="w-px h-12 bg-white/10"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{incorrect}</div>
            <div className="text-xs text-zinc-400 uppercase">Incorrect</div>
          </div>
          <div className="w-px h-12 bg-white/10"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-400">{unattempted}</div>
            <div className="text-xs text-zinc-400 uppercase">Unattempted</div>
          </div>
        </Panel>
      </div>

      <h3 className="text-xl font-bold text-white pt-4 border-t border-white/10">Detailed Solutions</h3>
      
      <div className="space-y-6">
        {test.test_questions.map((tq: any, idx: number) => {
          const response = responses.find((r: any) => r.test_question_id === tq.id);
          const q = tq.question;
          
          const isCorrect = response?.is_correct === true;
          const isIncorrect = response?.is_correct === false;
          const isUnattempted = !response || response.is_correct === null;

          const studentAnsId = response?.answer_json?.correct_option || response?.answer_json?.answer;
          const correctAnsId = q.answer_key?.correct_option || q.answer_key?.answer;

          return (
            <Panel key={tq.id} className={`border-l-4 ${isCorrect ? 'border-l-emerald-500' : isIncorrect ? 'border-l-red-500' : 'border-l-zinc-500'} relative`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-white/10 px-3 py-1 rounded-md text-white font-bold">Q{idx + 1}</span>
                  {isCorrect && <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Correct</span>}
                  {isIncorrect && <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase flex items-center gap-1"><XCircle className="w-3 h-3"/> Incorrect</span>}
                  {isUnattempted && <span className="text-xs font-bold bg-zinc-500/20 text-zinc-400 px-2 py-1 rounded uppercase flex items-center gap-1">Unattempted</span>}
                </div>
                
                <button 
                  onClick={() => setChallengeQid(challengeQid === q.id ? null : q.id)}
                  className="text-xs font-medium text-yellow-500 hover:text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1.5 rounded-md transition flex items-center gap-1.5"
                >
                  <Flag className="w-3.5 h-3.5" /> Challenge
                </button>
              </div>

              <div className="text-white mb-6">
                <ContentBlockRenderer blocks={q.content_json || []} />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Options</div>
                  {q.options_json?.options?.map((opt: any) => {
                    const isStudentMarked = studentAnsId === opt.id;
                    const isActualCorrect = correctAnsId === opt.id;
                    
                    let bg = "bg-white/5 border-white/5";
                    if (isActualCorrect) bg = "bg-emerald-500/10 border-emerald-500/30 text-emerald-300";
                    else if (isStudentMarked && !isActualCorrect) bg = "bg-red-500/10 border-red-500/30 text-red-300";

                    return (
                      <div key={opt.id} className={`p-3 rounded-lg border ${bg} flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <span className="font-bold opacity-50">{opt.id}.</span>
                          <span>{opt.text}</span>
                        </div>
                        <div className="flex gap-2">
                          {isActualCorrect && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {isStudentMarked && !isActualCorrect && <XCircle className="w-4 h-4 text-red-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-black/30 rounded-xl p-5 border border-white/5 h-fit">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Solution / Explanation</div>
                  {q.solution_json && q.solution_json.length > 0 ? (
                    <div className="text-sm text-zinc-300">
                      <ContentBlockRenderer blocks={q.solution_json} />
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">No solution provided by the creator.</p>
                  )}
                </div>
              </div>

              {/* Challenge Form */}
              {challengeQid === q.id && (
                <form 
                  onSubmit={(e) => handleChallengeSubmit(e, q.id, response?.id)}
                  className="mt-6 pt-6 border-t border-yellow-500/20 bg-yellow-500/5 p-6 rounded-xl animate-in fade-in slide-in-from-top-2"
                >
                  <h4 className="text-sm font-bold text-yellow-500 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> File a Challenge for this Question
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Reason</label>
                      <select 
                        value={challengeReason}
                        onChange={(e) => setChallengeReason(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-yellow-500/50"
                      >
                        <option value="WRONG_ANSWER_KEY">Wrong Answer Key</option>
                        <option value="AMBIGUOUS_QUESTION">Ambiguous Question</option>
                        <option value="WRONG_EXPLANATION">Wrong Explanation</option>
                        <option value="TYPO">Typo / Grammatical Error</option>
                        <option value="UNCLEAR_WORDING">Unclear Wording</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs text-zinc-400 mb-1">Description (Be specific)</label>
                    <textarea 
                      required
                      value={challengeDesc}
                      onChange={(e) => setChallengeDesc(e.target.value)}
                      rows={3}
                      placeholder="Explain why you are challenging this question..."
                      className="w-full bg-black/50 border border-white/10 rounded p-3 text-sm text-white outline-none focus:border-yellow-500/50"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setChallengeQid(null)}
                      className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={challengeMutation.isPending}
                      className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded shadow-md transition disabled:opacity-50"
                    >
                      {challengeMutation.isPending ? "Submitting..." : "Submit Challenge"}
                    </button>
                  </div>
                </form>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
