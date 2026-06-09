import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

const plan: any[] = [];

export default function StudyPlanPage() {
  return (
    <DashboardShell activeHref="/study-plan">
        <SectionTitle
          title="Study plan"
          subtitle="A placeholder AI study-plan page that already fits the roadmap look and can be wired to Claude later."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {plan.length === 0 ? (
            <Panel className="py-12 text-center text-sm text-zinc-500 lg:col-span-3">
              Your personalized study plan will appear here. Check back soon!
            </Panel>
          ) : (
            plan.map((item) => (
              <Panel key={item.day} accent={item.day === "Day 1"}>
                <div className="text-xs uppercase tracking-[0.2em] text-red-300/70">
                  {item.day}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.focus}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                  {item.tasks.map((task: string) => (
                    <li
                      key={task}
                      className="rounded-2xl bg-white/[0.03] px-3 py-2"
                    >
                      {task}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))
          )}
        </div>
    </DashboardShell>
  );
}
