import Panel from "../ui/Panel";

export type LeaderboardRow = {
  rank: number;
  name: string;
  score: number;
  accuracy: number;
  streak: number;
};

export default function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-base font-semibold text-white">Leaderboard</h3>
        <p className="mt-1 text-sm text-zinc-400">Weekly ranking snapshot</p>
      </div>

      <div className="divide-y divide-white/10">
        {rows.map((row) => (
          <div
            key={row.rank}
            className="grid grid-cols-[80px_minmax(0,1fr)_100px_100px_100px] gap-3 px-5 py-4 text-sm"
          >
            <div className="font-semibold text-red-300">#{row.rank}</div>
            <div className="truncate text-white">{row.name}</div>
            <div className="text-zinc-300">{row.score}</div>
            <div className="text-zinc-300">{row.accuracy}%</div>
            <div className="text-zinc-300">{row.streak}d</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
