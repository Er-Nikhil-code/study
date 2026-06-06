import Navbar from "@/components/layout/Navbar";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

const plan = [
  {
    day: "Day 1",
    focus: "Weak algebra topics",
    tasks: [
      "Quadratic equations",
      "Factorisation drills",
      "20-minute mock review",
    ],
  },
  {
    day: "Day 2",
    focus: "Physics fundamentals",
    tasks: ["Kinematics formulas", "Vector basics", "Timed concept quiz"],
  },
  {
    day: "Day 3",
    focus: "Mixed practice",
    tasks: [
      "25-question mixed test",
      "Error log update",
      "Revise top 5 mistakes",
    ],
  },
];

export default function StudyPlanPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionTitle
          title="Study plan"
          subtitle="A placeholder AI study-plan page that already fits the roadmap look and can be wired to Claude later."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {plan.map((item) => (
            <Panel key={item.day} accent={item.day === "Day 1"}>
              <div className="text-xs uppercase tracking-[0.2em] text-red-300/70">
                {item.day}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {item.focus}
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {item.tasks.map((task) => (
                  <li
                    key={task}
                    className="rounded-2xl bg-white/[0.03] px-3 py-2"
                  >
                    {task}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </main>
    </div>
  );
}
