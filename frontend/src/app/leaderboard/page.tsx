import Navbar from "@/components/layout/Navbar";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import SectionTitle from "@/components/ui/SectionTitle";
import { mockLeaderboard } from "@/lib/mock-data";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionTitle
          title="Leaderboard"
          subtitle="Built to match the current design language with a dark glass card and red accent."
        />
        <div className="mt-6">
          <LeaderboardTable rows={mockLeaderboard} />
        </div>
      </main>
    </div>
  );
}
