import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

const navItems = [
  { label: "Teacher home", href: "/teacher" },
  { label: "Questions", href: "/teacher/questions" },
  { label: "Tests", href: "/teacher/tests" },
  { label: "Challenges", href: "/teacher/challenges" },
];

export default function TeacherHomePage() {
  return (
    <DashboardShell activeHref="/teacher" navItems={navItems}>
      <SectionTitle
        title="Teacher dashboard"
        subtitle="Central hub for question, test, and challenge workflows."
      />

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Panel accent>
          <div className="text-sm text-zinc-400">Questions</div>
          <div className="mt-2 text-3xl font-semibold text-white">128</div>
        </Panel>
        <Panel>
          <div className="text-sm text-zinc-400">Tests</div>
          <div className="mt-2 text-3xl font-semibold text-white">24</div>
        </Panel>
        <Panel>
          <div className="text-sm text-zinc-400">Challenges</div>
          <div className="mt-2 text-3xl font-semibold text-red-300">7</div>
        </Panel>
      </div>

      <div className="mt-6">
        <Link
          href="/teacher/questions"
          className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
        >
          Open question bank
        </Link>
      </div>
    </DashboardShell>
  );
}
