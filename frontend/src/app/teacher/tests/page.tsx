import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

const navItems = [
  { label: "Teacher home", href: "/teacher" },
  { label: "Questions", href: "/teacher/questions" },
  { label: "Tests", href: "/teacher/tests" },
  { label: "Challenges", href: "/teacher/challenges" },
];

const tests = [
  {
    id: "T-2001",
    title: "JEE Weekly Mock 1",
    schedule: "Today, 6:00 PM",
    questions: 90,
    duration: "3h",
    status: "Live",
  },
  {
    id: "T-2002",
    title: "NEET Biology Sprint",
    schedule: "Tomorrow, 9:00 AM",
    questions: 60,
    duration: "90m",
    status: "Scheduled",
  },
  {
    id: "T-2003",
    title: "Quant Practice Set",
    schedule: "Draft",
    questions: 30,
    duration: "45m",
    status: "Draft",
  },
];

export default function TeacherTestsPage() {
  return (
    <DashboardShell activeHref="/teacher/tests">
      <SectionTitle
        title="Tests"
        subtitle="Create, schedule, and manage test sets from the teacher panel."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {tests.map((test) => (
          <Panel key={test.id} accent={test.status === "Live"} className="p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {test.id}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-white">
              {test.title}
            </h3>

            <div className="mt-4 space-y-2 text-sm text-zinc-400">
              <div className="flex items-center justify-between gap-4">
                <span>Schedule</span>
                <span className="text-zinc-200">{test.schedule}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Questions</span>
                <span className="text-zinc-200">{test.questions}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Duration</span>
                <span className="text-zinc-200">{test.duration}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Status</span>
                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    test.status === "Live"
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : test.status === "Scheduled"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/20 bg-red-500/10 text-red-300",
                  ].join(" ")}
                >
                  {test.status}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
                Open
              </button>
              <button className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                Edit
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </DashboardShell>
  );
}
