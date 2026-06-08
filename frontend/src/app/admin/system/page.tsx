import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";

export default function AdminSystemPage() {
  return (
    <DashboardShell activeHref="/admin/system" navItems={adminNavItems}>
      <SectionTitle
        title="System Status"
        subtitle="Monitor platform health, server metrics, and active background services."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">API Server</h3>
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">99.9%</span>
            <span className="text-sm text-zinc-500">Uptime</span>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Database</h3>
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">14ms</span>
            <span className="text-sm text-zinc-500">Avg Latency</span>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Active Users</h3>
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">128</span>
            <span className="text-sm text-zinc-500">Online</span>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel className="p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">System Logs</h3>
          <div className="space-y-3 font-mono text-xs text-zinc-400">
            <div className="flex items-center gap-3">
              <span className="text-zinc-600">14:02:45</span>
              <span className="text-emerald-400">[INFO]</span>
              <span>Database backup completed successfully.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-600">13:45:12</span>
              <span className="text-emerald-400">[INFO]</span>
              <span>New role "CONTENT_HEAD" created by Admin.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-600">13:30:00</span>
              <span className="text-red-400">[WARN]</span>
              <span>High memory usage detected on worker node 2.</span>
            </div>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
