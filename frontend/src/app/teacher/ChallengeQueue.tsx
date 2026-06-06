import Panel from "@/components/ui/Panel";

const items = [
  {
    id: "CH-001",
    reason: "Wrong Answer Key",
    student: "Aarav",
  },
  {
    id: "CH-002",
    reason: "Ambiguous Question",
    student: "Diya",
  },
];

export default function ChallengeQueue() {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Panel key={item.id}>
          <div className="flex justify-between">
            <div>
              <div className="text-white font-medium">{item.reason}</div>

              <div className="text-sm text-zinc-400">{item.student}</div>
            </div>

            <button className="rounded-full bg-red-600 px-4 py-2 text-sm text-white">
              Review
            </button>
          </div>
        </Panel>
      ))}
    </div>
  );
}
