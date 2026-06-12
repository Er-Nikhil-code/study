"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { QuestionsService } from "@/services/questions.service";
import { HierarchyService } from "@/services/hierarchy.service";
import authService from "@/services/auth.service";

// Sub-components
import McqForm from "../../create/forms/McqForm";
import TrueFalseForm from "../../create/forms/TrueFalseForm";
import FillBlankForm from "../../create/forms/FillBlankForm";
import MatchingForm from "../../create/forms/MatchingForm";
import PassageForm from "../../create/forms/PassageForm";
import AssertionReasonForm from "../../create/forms/AssertionReasonForm";

const getNavItems = (role: string) => {
  if (role === "INTERN") {
    return [
      { label: "Pawn Dashboard", href: "/intern/dashboard" },
      { label: "Question Bank", href: "/teacher/questions" },
    ];
  }
  return [
    { label: "Knight home", href: "/teacher" },
    { label: "Questions", href: "/teacher/questions" },
    { label: "Tests", href: "/teacher/tests" },
    { label: "Challenges", href: "/teacher/challenges" },
  ];
};

export default function EditQuestionPage() {
  const unwrappedParams = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [role, setRole] = useState("");
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // General Data
  const [formData, setFormData] = useState({
    course_id: "",
    section_id: "",
    chapter_id: "",
    topic_id: "",
    difficulty: "MEDIUM",
    type: "SINGLE_CORRECT",
    content: "",
    solution: "",
    is_pyq: false,
    exam_name: "",
    exam_year: new Date().getFullYear().toString(),
    exam_shift: "",
  });

  // Type-specific states
  const [mcqData, setMcqData] = useState({
    options: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" }
    ],
    correct_option: "A",
    correct_options: ["A"] as string[]
  });

  const [tfData, setTfData] = useState({
    answer: true,
    options: [
      { id: "A", text: "True" },
      { id: "B", text: "False" }
    ],
    correct_option: "A"
  });

  const [fibData, setFibData] = useState({
    blanks: [{ position: 1, answer: "", case_sensitive: false }],
    options: [
      { id: "A", text: "" },
      { id: "B", text: "" },
      { id: "C", text: "" },
      { id: "D", text: "" }
    ],
    correct_option: "A"
  });

  const [matchingData, setMatchingData] = useState({
    left_column: [{ id: "L1", text: "" }, { id: "L2", text: "" }],
    right_column: [{ id: "R1", text: "" }, { id: "R2", text: "" }],
    pairs: [{ left_id: "L1", right_id: "R1" }, { left_id: "L2", right_id: "R2" }]
  });

  const [passageData, setPassageData] = useState({
    sub_questions: [] as any[],
    answers: {} as any
  });

  useEffect(() => {
    const user = authService.getUser();
    if (user?.role) setRole(user.role);

    HierarchyService.getFullHierarchy()
      .then(setTopics) // We reuse 'topics' state for 'hierarchy' for now
      .catch((err) => {
        console.error("Failed to load hierarchy:", err);
        setError("Failed to load hierarchy for dropdown.");
      });

    QuestionsService.getById(unwrappedParams.id as string)
      .then((q: any) => {
        setFormData({
          course_id: q.topic?.chapter?.section?.course?.id || "",
          section_id: q.topic?.chapter?.section?.id || "",
          chapter_id: q.topic?.chapter?.id || "",
          topic_id: q.topic_id || "",
          difficulty: q.difficulty || "MEDIUM",
          type: q.question_type || "SINGLE_CORRECT",
          content: q.content_json?.[0]?.content || "",
          solution: q.solution_json?.[0]?.content || "",
          is_pyq: !!q.metadata_json?.is_pyq,
          exam_name: q.metadata_json?.exam_name || "",
          exam_year: q.metadata_json?.exam_year || new Date().getFullYear().toString(),
          exam_shift: q.metadata_json?.exam_shift || "",
        });

        if (q.question_type === "SINGLE_CORRECT" || q.question_type === "ASSERTION_REASON") {
          const loadedOptions = (q.options_json?.options || [{ id: "A", text: "" }]).map((o: any, i: number) => ({
            ...o,
            id: String.fromCharCode(65 + i)
          }));
          setMcqData({
            options: loadedOptions,
            correct_option: q.answer_key?.correct_option || "A",
            correct_options: [q.answer_key?.correct_option || "A"],
          });
        } else if (q.question_type === "MULTIPLE_CORRECT") {
          const loadedOptions = (q.options_json?.options || [{ id: "A", text: "" }]).map((o: any, i: number) => ({
            ...o,
            id: String.fromCharCode(65 + i)
          }));
          setMcqData({
            options: loadedOptions,
            correct_option: "A",
            correct_options: q.answer_key?.correct_options || ["A"],
          });
        } else if (q.question_type === "TRUE_FALSE") {
          const defaultTfOptions = [
            { id: "A", text: "True" },
            { id: "B", text: "False" }
          ];
          const hasOptions = q.options_json?.options && q.options_json.options.length > 0;
          setTfData({ 
            answer: q.answer_key?.answer ?? true,
            options: hasOptions ? q.options_json.options : defaultTfOptions,
            correct_option: q.answer_key?.correct_option || (q.answer_key?.answer ? "A" : "B")
          });
        } else if (q.question_type === "FILL_BLANK") {
          const defaultFibOptions = [
            { id: "A", text: "" },
            { id: "B", text: "" },
            { id: "C", text: "" },
            { id: "D", text: "" }
          ];
          const hasOptions = q.options_json?.options && q.options_json.options.length > 0;
          setFibData({ 
            blanks: q.answer_key?.blanks || [{ position: 1, answer: "", case_sensitive: false }],
            options: hasOptions ? q.options_json.options : defaultFibOptions,
            correct_option: q.answer_key?.correct_option || "A"
          });
        } else if (q.question_type === "MATCHING") {
          setMatchingData({
            left_column: q.options_json?.left_column || [{ id: "L1", text: "" }],
            right_column: q.options_json?.right_column || [{ id: "R1", text: "" }],
            pairs: q.answer_key?.pairs || [{ left_id: "L1", right_id: "R1" }]
          });
        } else if (q.question_type === "PASSAGE") {
          setPassageData({
            sub_questions: q.options_json?.sub_questions || [],
            answers: q.answer_key?.answers || {}
          });
        }
      })
      .catch((err) => {
        setError("Failed to load question details");
      })
      .finally(() => setLoading(false));
  }, [unwrappedParams.id]);
  const createMutation = useMutation({
    mutationFn: (payload: any) => QuestionsService.update(unwrappedParams.id as string, payload),
    onSuccess: () => {
      // Invalidate the questions cache to fetch the new question instantly
      queryClient.invalidateQueries({ queryKey: ["questions", "list"] });
      // Instantly route to the questions bank 
      router.push(role === "INTERN" ? "/intern/questions" : role === "ADMIN" ? "/admin/questions" : "/teacher/questions");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err.message || "Failed to create question");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload: any = {
        topic_id: formData.topic_id,
        difficulty: formData.difficulty,
        type: formData.type,
        content_json: [{ type: "TEXT", content: formData.content }],
        solution_json: formData.solution ? [{ type: "TEXT", content: formData.solution }] : [],
        metadata_json: formData.is_pyq ? {
          is_pyq: true,
          exam_name: formData.exam_name,
          exam_year: formData.exam_year,
          exam_shift: formData.exam_shift
        } : {}
      };

      // Construct Payload based on Question Type
      switch (formData.type) {
        case "SINGLE_CORRECT":
        case "ASSERTION_REASON":
          payload.options_json = { options: mcqData.options };
          payload.answer_key = { correct_option: mcqData.correct_option };
          break;
        case "MULTIPLE_CORRECT":
          payload.options_json = { options: mcqData.options };
          payload.answer_key = { correct_options: mcqData.correct_options };
          break;
        case "TRUE_FALSE":
          payload.options_json = { options: tfData.options };
          payload.answer_key = { answer: tfData.answer, correct_option: tfData.correct_option };
          break;
        case "FILL_BLANK":
          payload.options_json = { options: fibData.options };
          payload.answer_key = { blanks: fibData.blanks, correct_option: fibData.correct_option };
          break;
        case "MATCHING":
          payload.options_json = {
            left_column: matchingData.left_column,
            right_column: matchingData.right_column
          };
          payload.answer_key = { pairs: matchingData.pairs };
          break;
        case "PASSAGE":
          payload.options_json = { sub_questions: passageData.sub_questions };
          payload.answer_key = { answers: passageData.answers };
          break;
        default:
          throw new Error("Unsupported question type");
      }

      // Fire mutation
      createMutation.mutate(payload);
    } catch (err: any) {
      setError(err?.message || "Failed to prepare question");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionTitle title="Edit Question" subtitle={`Update question ${unwrappedParams.id}`} />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-w-4xl pb-16">
        {error && (
          <div className="rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* General Info */}
        <Panel className="space-y-5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">General Info</h2>
          
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Course</label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value, section_id: "", chapter_id: "", topic_id: "" })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 appearance-none"
              >
                  <option value="">Select Course</option>
                  {topics.map((c: any) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Section</label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value, chapter_id: "", topic_id: "" })}
                  disabled={!formData.course_id}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 appearance-none disabled:opacity-50"
                >
                  <option value="">Select Section</option>
                  {topics.find((c: any) => c.id === formData.course_id)?.sections?.map((s: any) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Chapter</label>
                <select
                  value={formData.chapter_id}
                  onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value, topic_id: "" })}
                  disabled={!formData.section_id}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 appearance-none disabled:opacity-50"
                >
                  <option value="">Select Chapter</option>
                  {topics.find((c: any) => c.id === formData.course_id)?.sections?.find((s: any) => s.id === formData.section_id)?.chapters?.map((ch: any) => (
                    <option key={ch.id} value={ch.id} className="bg-zinc-900">{ch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Topic</label>
                <select
                  required
                  value={formData.topic_id}
                  onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                  disabled={!formData.chapter_id}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 appearance-none disabled:opacity-50"
                >
                  <option value="">Select Topic</option>
                  {topics.find((c: any) => c.id === formData.course_id)?.sections?.find((s: any) => s.id === formData.section_id)?.chapters?.find((ch: any) => ch.id === formData.chapter_id)?.topics?.map((t: any) => (
                    <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>
                  ))}
                </select>
              </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Question Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 appearance-none text-red-300 font-medium"
              >
                <option value="SINGLE_CORRECT" className="bg-zinc-900 text-white">Single Correct (MCQ)</option>
                <option value="MULTIPLE_CORRECT" className="bg-zinc-900 text-white">Multiple Correct (MCQ)</option>
                <option value="TRUE_FALSE" className="bg-zinc-900 text-white">True / False</option>
                <option value="FILL_BLANK" className="bg-zinc-900 text-white">Fill in the Blank</option>
                <option value="MATCHING" className="bg-zinc-900 text-white">Matching</option>
                <option value="PASSAGE" className="bg-zinc-900 text-white">Passage (Comprehension)</option>
                <option value="ASSERTION_REASON" className="bg-zinc-900 text-white">Assertion-Reasoning</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30 appearance-none"
              >
                <option value="EASY" className="bg-zinc-900">EASY</option>
                <option value="MEDIUM" className="bg-zinc-900">MEDIUM</option>
                <option value="HARD" className="bg-zinc-900">HARD</option>
              </select>
            </div>
          </div>
        </Panel>

        {/* Content Statement */}
        <Panel className="space-y-5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            {formData.type === "PASSAGE" ? "Main Passage Text" : formData.type === "ASSERTION_REASON" ? "Assertion & Reason Statement" : "Question Statement"}
          </h2>
          <div>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none focus:border-red-500/30 font-mono"
              placeholder={formData.type === "PASSAGE" ? "Enter passage content" : formData.type === "ASSERTION_REASON" ? "Assertion (A): ...\nReason (R): ..." : "Enter question statement"}
            />
          </div>
        </Panel>

        {/* Dynamic Type-Specific UI */}
        {(formData.type === "SINGLE_CORRECT" || formData.type === "MULTIPLE_CORRECT") && (
          <McqForm type={formData.type} data={mcqData} onChange={setMcqData} />
        )}
        {formData.type === "ASSERTION_REASON" && (
          <AssertionReasonForm data={mcqData} onChange={setMcqData} />
        )}
        {formData.type === "TRUE_FALSE" && (
          <TrueFalseForm data={tfData} onChange={setTfData} />
        )}
        {formData.type === "FILL_BLANK" && (
          <FillBlankForm data={fibData} onChange={setFibData} />
        )}
        {formData.type === "MATCHING" && (
          <MatchingForm data={matchingData} onChange={setMatchingData} />
        )}
        {formData.type === "PASSAGE" && (
          <PassageForm data={passageData} onChange={setPassageData} />
        )}

        {/* PYQ Metadata */}
        <Panel className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Previous Year Question</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-zinc-400">Is this a PYQ?</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.is_pyq}
                  onChange={(e) => setFormData({ ...formData, is_pyq: e.target.checked })}
                />
                <div className={`block w-10 h-6 rounded-full transition ${formData.is_pyq ? 'bg-red-500' : 'bg-zinc-700'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${formData.is_pyq ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          {formData.is_pyq && (
            <div className="grid gap-4 sm:grid-cols-3 mt-4">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Exam Name</label>
                <input
                  type="text"
                  required={formData.is_pyq}
                  value={formData.exam_name}
                  onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
                  placeholder="Exam category"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Year</label>
                <input
                  type="number"
                  required={formData.is_pyq}
                  value={formData.exam_year}
                  onChange={(e) => setFormData({ ...formData, exam_year: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
                  placeholder="Year"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Shift / Paper</label>
                <input
                  type="text"
                  value={formData.exam_shift}
                  onChange={(e) => setFormData({ ...formData, exam_shift: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none focus:border-red-500/30"
                  placeholder="Shift/Variant"
                />
              </div>
            </div>
          )}
        </Panel>

        {/* Solution */}
        <Panel className="space-y-5">
          <h2 className="text-sm uppercase tracking-[0.2em] text-zinc-500">Solution (Optional)</h2>
          <div>
            <textarea
              rows={3}
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white outline-none focus:border-red-500/30"
              placeholder="Detailed solution or explanation"
            />
          </div>
        </Panel>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-2 font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(role === "INTERN" ? "/intern/questions" : role === "ADMIN" ? "/admin/questions" : "/teacher/questions")}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
