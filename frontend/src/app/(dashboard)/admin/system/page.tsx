"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import adminService from "@/services/admin.service";
import { Trash2 } from "lucide-react";

export default function AdminSystemPage() {
  const queryClient = useQueryClient();

  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ["admin", "system-status"],
    queryFn: () => adminService.getSystemStatus(),
    refetchInterval: 10000, // Refresh every 10s
  });

  const { data: logsData, isLoading: loadingLogs } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => adminService.getAuditLogs({ take: 20 }),
  });

  const clearLogsMutation = useMutation({
    mutationFn: () => adminService.clearAuditLogs(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-logs"] });
    },
  });

  const logs = logsData?.data || [];

  return (
    <>
      <SectionTitle
        title="System Status"
        subtitle="Monitor platform health, server metrics, and active background services."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Panel className="p-5 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-sm font-semibold text-zinc-300">API Server</h3>
            <span className={`flex h-3 w-3 rounded-full shadow-[0_0_8px_currentColor] ${status?.status === "healthy" ? "bg-emerald-500 text-emerald-500" : "bg-red-500 text-red-500"}`}></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2 relative z-10">
            {loadingStatus ? (
              <span className="h-8 w-16 animate-pulse rounded bg-white/10" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white">
                  {status ? (status.uptime > 3600 ? `${(status.uptime / 3600).toFixed(1)}h` : `${Math.floor(status.uptime / 60)}m`) : "—"}
                </span>
                <span className="text-sm text-zinc-500">Uptime</span>
              </>
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Database</h3>
            <span className={`flex h-3 w-3 rounded-full shadow-[0_0_8px_currentColor] ${status?.db_latency_ms > 0 && status.db_latency_ms < 100 ? "bg-emerald-500 text-emerald-500" : "bg-red-500 text-red-500"}`}></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loadingStatus ? (
              <span className="h-8 w-16 animate-pulse rounded bg-white/10" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white">{status?.db_latency_ms > 0 ? `${status.db_latency_ms}ms` : "—"}</span>
                <span className="text-sm text-zinc-500">Avg Latency</span>
              </>
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Active Users</h3>
            <span className={`flex h-3 w-3 rounded-full shadow-[0_0_8px_currentColor] ${status?.active_users > 0 ? "bg-emerald-500 text-emerald-500" : "bg-zinc-500 text-zinc-500"}`}></span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            {loadingStatus ? (
              <span className="h-8 w-16 animate-pulse rounded bg-white/10" />
            ) : (
              <>
                <span className="text-3xl font-bold text-white">{status?.active_users ?? "—"}</span>
                <span className="text-sm text-zinc-500">24h Active</span>
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300">System Audit Logs</h3>
            <button
              onClick={() => clearLogsMutation.mutate()}
              disabled={clearLogsMutation.isPending || logs.length === 0}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              {clearLogsMutation.isPending ? "Clearing..." : "Clear Logs"}
            </button>
          </div>
          
          <div className="space-y-3 font-mono text-xs text-zinc-400 max-h-[600px] overflow-y-auto pr-2">
            {loadingLogs ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 w-full animate-pulse rounded bg-white/5" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-zinc-500 py-4 text-center">No recent activity logs.</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-zinc-600 w-20">{new Date(log.created_at).toLocaleTimeString()}</span>
                    <span className="text-emerald-400 w-32 shrink-0">[{log.action.toUpperCase()}]</span>
                  </div>
                  <div className="flex-1 min-w-0 break-words">
                    <span className="text-zinc-500">{log.actor?.email || "System"}: </span>
                    <span className="text-white">Modified {log.entity_type} {log.entity_id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
