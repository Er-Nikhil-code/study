import Panel from "@/components/ui/Panel";

const approvals = [
  {
    id: "APP-001",
    name: "Priya Nair",
    subject: "Mathematics",
  },
  {
    id: "APP-002",
    name: "Rohan Gupta",
    subject: "Physics",
  },
];

export default function ApprovalQueue() {
  return (
    <div className="space-y-4">
      {approvals.map((item) => (
        <Panel key={item.id}>
          <div className="flex justify-between">
            <div>
              <div className="font-medium text-white">{item.name}</div>

              <div className="text-sm text-zinc-400">{item.subject}</div>
            </div>

            <div className="flex gap-2">
              <button className="rounded-full bg-emerald-600 px-4 py-2 text-white">
                Approve
              </button>

              <button className="rounded-full bg-red-600 px-4 py-2 text-white">
                Reject
              </button>
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
