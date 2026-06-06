import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

const navItems = [
  { label: "Teacher home", href: "/teacher" },
  { label: "Questions", href: "/teacher/questions" },
  { label: "Tests", href: "/teacher/tests" },
  { label: "Challenges", href: "/teacher/challenges" },
];

const questions = [
  {
    id: "Q-1001",
    title: "Quadratic equations and roots",
    subject: "Mathematics",
    status: "Published",
    topic: "Algebra",
  },
  {
    id: "Q-1002",
    title: "Motion in a straight line",
    subject: "Physics",
    status: "Draft",
    topic: "Mechanics",
  },
  {
    id: "Q-1003",
    title: "Cell structure and functions",
    subject: "Biology",
    status: "Published",
    topic: "Cell Biology",
  },
];

export default function TeacherQuestionsPage() {
  return (
    <DashboardShell activeHref="/teacher/questions" navItems={navItems}>
      <SectionTitle
        title="Question bank"
        subtitle="Teacher-facing question workspace with the current visual style."
      />

      <div className="mt-6 grid gap-4">
        {questions.map((question) => (
          <Panel
            key={question.id}
            accent={question.status === "Draft"}
            className="p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {question.id}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {question.title}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm text-zinc-400">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                    {question.subject}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                    {question.topic}
                  </span>
                </div>
              </div>

              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  question.status === "Published"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-300",
                ].join(" ")}
              >
                {question.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
                Edit
              </button>
              <button className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                Preview
              </button>
              <button className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                Version history
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </DashboardShell>
  );
}
