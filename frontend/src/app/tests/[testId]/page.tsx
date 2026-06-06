import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

type PageProps = {
  params: Promise<{ testId: string }>;
};

export default async function TestDetailsPage({ params }: PageProps) {
  const { testId } = await params;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionTitle
          title="Test details"
          subtitle="A clean detail page before entering the timed attempt."
        />

        <Panel accent className="mt-6">
          <div className="space-y-3">
            <div className="text-sm text-zinc-400">Test ID</div>
            <div className="text-2xl font-semibold text-white">{testId}</div>
            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
              This is a safe placeholder detail page that matches the current
              theme and can later be wired to your real test payload API.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/tests/${testId}/attempt`}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/15"
            >
              Start attempt
            </Link>
            <Link
              href="/tests"
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.06]"
            >
              Back to tests
            </Link>
          </div>
        </Panel>
      </main>
    </div>
  );
}
