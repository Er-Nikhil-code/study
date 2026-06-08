import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";

const challenges = [
  {
    id: "ESC-5001",
    issue: "Wrong answer key",
    test: "JEE Weekly Mock 1",
    priority: "High",
  },
  {
    id: "ESC-5002",
    issue: "Ambiguous wording",
    test: "NEET Biology Sprint",
    priority: "Medium",
  },
  {
    id: "ESC-5003",
    issue: "Wrong explanation",
    test: "Quant Practice Set",
    priority: "High",
  },
];

export default function AdminChallengesPage() {
  return (
    <DashboardShell activeHref="/admin/challenges" navItems={adminNavItems}>
      <SectionTitle
        title="Escalated challenges"
        subtitle="Admin override queue for unresolved or escalated student issues."
      />

      <div className="mt-6 grid gap-4">
        {challenges.map((item) => (
          <Panel
            key={item.id}
            accent={item.priority === "High"}
            className="p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {item.id}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.issue}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{item.test}</p>
              </div>

              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  item.priority === "High"
                    ? "border-red-500/30 bg-red-500/10 text-red-200"
                    : "border-red-500/20 bg-red-500/10 text-red-300",
                ].join(" ")}
              >
                {item.priority}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15">
                Resolve
              </button>
              <button className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
                Override
              </button>
              <button className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                View thread
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </DashboardShell>
  );
}
