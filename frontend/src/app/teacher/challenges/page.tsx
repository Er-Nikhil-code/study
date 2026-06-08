import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

const navItems = [
  { label: "Teacher home", href: "/teacher" },
  { label: "Questions", href: "/teacher/questions" },
  { label: "Tests", href: "/teacher/tests" },
  { label: "Challenges", href: "/teacher/challenges" },
];

const challenges = [
  {
    id: "CH-3001",
    student: "Aarav Sharma",
    reason: "Wrong answer key",
    status: "Pending",
    test: "JEE Weekly Mock 1",
  },
  {
    id: "CH-3002",
    student: "Diya Mehta",
    reason: "Ambiguous wording",
    status: "Reviewed",
    test: "NEET Biology Sprint",
  },
  {
    id: "CH-3003",
    student: "Kabir Singh",
    reason: "Wrong explanation",
    status: "Escalated",
    test: "Quant Practice Set",
  },
];

export default function TeacherChallengesPage() {
  return (
    <DashboardShell activeHref="/teacher/challenges" navItems={navItems}>
      <SectionTitle
        title="Challenges"
        subtitle="Review student challenge submissions and resolve them from one place."
      />

      <div className="mt-6 grid gap-4">
        {challenges.map((challenge) => (
          <Panel
            key={challenge.id}
            accent={challenge.status === "Pending"}
            className="p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {challenge.id}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {challenge.student}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{challenge.test}</p>
              </div>

              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  challenge.status === "Pending"
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : challenge.status === "Reviewed"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/20 bg-red-500/10 text-red-200",
                ].join(" ")}
              >
                {challenge.status}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Reason
              </div>
              <div className="mt-2 text-sm text-zinc-200">
                {challenge.reason}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15">
                Accept
              </button>
              <button className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
                Reject
              </button>
              <button className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                Escalate
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </DashboardShell>
  );
}
