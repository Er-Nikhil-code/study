import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";

const approvals = [
  {
    id: "TA-4001",
    name: "Priya Nair",
    email: "priya@example.com",
    subject: "Mathematics",
    status: "Pending",
  },
  {
    id: "TA-4002",
    name: "Rohan Gupta",
    email: "rohan@example.com",
    subject: "Physics",
    status: "Pending",
  },
  {
    id: "TA-4003",
    name: "Meera Iyer",
    email: "meera@example.com",
    subject: "Biology",
    status: "Reviewed",
  },
];

export default function AdminApprovalsPage() {
  return (
    <DashboardShell activeHref="/admin/approvals" navItems={adminNavItems}>
      <SectionTitle
        title="Teacher approvals"
        subtitle="Review pending teacher applications and move them through the approval flow."
      />

      <div className="mt-6 grid gap-4">
        {approvals.map((item) => (
          <Panel
            key={item.id}
            accent={item.status === "Pending"}
            className="p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {item.id}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{item.email}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Subject: {item.subject}
                </p>
              </div>

              <span
                className={[
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  item.status === "Pending"
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
                ].join(" ")}
              >
                {item.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/15">
                Approve
              </button>
              <button className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15">
                Reject
              </button>
              <button className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]">
                View profile
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </DashboardShell>
  );
}
