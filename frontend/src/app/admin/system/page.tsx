"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";
import adminService from "@/services/admin.service";

export default function AdminSystemPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAuditLogs({ take: 10 }).then(res => {
      setLogs(res.data);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <DashboardShell activeHref="/admin/system">
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
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">System Audit Logs</h3>
          <div className="space-y-3 font-mono text-xs text-zinc-400">
            {loading ? (
              <p>Loading logs...</p>
            ) : logs.length === 0 ? (
              <p>No recent activity logs.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-b border-white/5 pb-2">
                  <span className="text-zinc-600 whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString()}</span>
                  <span className="text-emerald-400 whitespace-nowrap">[{log.action.toUpperCase()}]</span>
                  <span className="text-zinc-500 whitespace-nowrap">{log.actor?.email || "System"}:</span>
                  <span className="text-white">Modified {log.entity_type} {log.entity_id}</span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
