import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

const navItems = [
  { label: "Admin home", href: "/admin" },
  { label: "Approvals", href: "/admin/approvals" },
  { label: "Users", href: "/admin/users" },
  { label: "Challenges", href: "/admin/challenges" },
  { label: "System", href: "/admin/system" },
];

export default function AdminHomePage() {
  return (
    <DashboardShell activeHref="/admin" navItems={navItems}>
      <SectionTitle
        title="Admin dashboard"
        subtitle="Oversight, moderation, and system health in one place."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Panel accent>
          <div className="text-sm text-zinc-400">Approvals</div>
          <div className="mt-2 text-3xl font-semibold text-white">12</div>
        </Panel>
        <Panel>
          <div className="text-sm text-zinc-400">Users</div>
          <div className="mt-2 text-3xl font-semibold text-white">4,281</div>
        </Panel>
        <Panel>
          <div className="text-sm text-zinc-400">Incidents</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-300">0</div>
        </Panel>
      </div>

      <div className="mt-6">
        <Link
          href="/admin/approvals"
          className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
        >
          Review approvals
        </Link>
      </div>
    </DashboardShell>
  );
}
