import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/ui/EmptyState";
import SectionTitle from "@/components/ui/SectionTitle";
import ResultSummary from "@/components/results/ResultSummary";

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionTitle
          title="Results"
          subtitle="A clean results landing page with the same theme."
        />

        <div className="mt-6">
          <ResultSummary
            score={72}
            maxScore={100}
            percentile={91}
            timeTaken="01:18:42"
            correct={36}
            wrong={8}
            skipped={4}
          />
        </div>

        <div className="mt-6">
          <EmptyState
            title="Results list can hook to your backend"
            description="This page is structured to later render every attempt in a searchable list."
          />
        </div>
      </main>
    </div>
  );
}
