import Panel from "@/components/ui/Panel";

const logs = [
  "Teacher approved: Priya Nair",
  "Question updated: Q-1001",
  "Challenge resolved: CH-001",
  "Leaderboard snapshot generated",
];

export default function AuditLogTable() {
  return (
    <Panel>
      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300"
          >
            {log}
          </div>
        ))}
      </div>
    </Panel>
  );
}
