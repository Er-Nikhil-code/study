import Navbar from "@/components/layout/Navbar";
import Panel from "@/components/ui/Panel";
import ResultSummary from "@/components/results/ResultSummary";

type PageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function AttemptResultPage({ params }: PageProps) {
  const { attemptId } = await params;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Panel accent>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Attempt ID
          </div>
          <div className="mt-2 text-xl font-semibold text-white">
            {attemptId}
          </div>
        </Panel>

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
      </main>
    </div>
  );
}
