import Navbar from "@/components/layout/Navbar";
import EmptyState from "@/components/ui/EmptyState";
import SectionTitle from "@/components/ui/SectionTitle";
import TestCard from "@/components/tests/TestCard";
import { mockTests } from "@/lib/mock-data";

export default function TestsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.12),_transparent_30%),linear-gradient(to_bottom,_#000,_#090909_50%,_#000)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionTitle
          title="Available tests"
          subtitle="Pick a mock, start a timed attempt, and continue in the same dark red theme."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {mockTests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>

        <div className="mt-6">
          <EmptyState
            title="No more tests"
            description="This page is ready to connect to your backend test list endpoint. For now it renders safely with local mock data."
            actionLabel="Go home"
            actionHref="/"
          />
        </div>
      </main>
    </div>
  );
}
