import StatCard from "@/components/ui/StatCard";

export default function SystemHealthPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard label="API Latency" value="214ms" />
      <StatCard label="Error Rate" value="0.4%" />
      <StatCard label="Redis Hit Rate" value="92%" />
      <StatCard label="Queue Lag" value="12" />
    </div>
  );
}
