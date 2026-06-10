"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "./nav";
import adminService, { type DashboardStats } from "@/services/admin.service";
import { Users, FileQuestion, ShieldAlert, Shield, Activity, Bell, CheckCircle, XCircle } from "lucide-react";

function StatCard({
  label,
  value,
  accent = false,
  loading = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <Panel accent={accent}>
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-2 text-3xl font-semibold ${accent ? "text-red-300" : "text-white"}`}
      >
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded-lg bg-white/10" />
        ) : (
          value
        )}
      </div>
    </Panel>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AdminHomePage() {
  const { data: stats, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => adminService.getDashboardStats(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });

  const { data: activity } = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: () => adminService.getRecentActivity(8),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  const error = queryError ? (queryError as any)?.response?.data?.message || "Failed to load stats" : null;

  return (
    <>
      <SectionTitle
        title="Admin Dashboard"
        subtitle="Oversight, moderation, and system health in one place."
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Users" value={stats?.totalUsers ?? "—"} loading={loading} />
        <StatCard label="Total Questions" value={stats?.totalQuestions ?? "—"} loading={loading} />
        <StatCard label="Open Challenges" value={stats?.openChallenges ?? "—"} accent={(stats?.openChallenges ?? 0) > 0} loading={loading} />
        <StatCard label="Students" value={stats?.totalStudents ?? "—"} loading={loading} />
        <StatCard label="Teachers" value={stats?.totalTeachers ?? "—"} loading={loading} />
        <StatCard label="Custom Roles" value={stats?.totalRoles ?? "—"} loading={loading} />
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/admin/users", icon: <Users size={16} />, label: "Manage Users", desc: "Search, edit roles, and delete user accounts" },
          { href: "/admin/roles", icon: <Shield size={16} />, label: "Manage Roles", desc: "Add, edit, and configure permission-based roles" },
          { href: "/admin/questions", icon: <FileQuestion size={16} />, label: "Manage Questions", desc: "Browse, search, and moderate the question bank" },
          { href: "/admin/challenges", icon: <ShieldAlert size={16} />, label: "Challenges", desc: "Review disputed questions and answer keys" },
          { href: "/admin/system", icon: <Activity size={16} />, label: "System Health", desc: "Monitor API performance, queues, and errors" },
          { href: "/notifications", icon: <Bell size={16} />, label: "Notifications", desc: "View system alerts and global announcements" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
          >
            <div className="mt-0.5 text-zinc-500 group-hover:text-red-400 transition">{item.icon}</div>
            <div>
              <div className="text-sm font-medium text-white">{item.label}</div>
              <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      {activity && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Recent signups */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Recent Signups</h3>
            <div className="space-y-2">
              {activity.recent_users.slice(0, 5).map((u: any) => (
                <Panel key={u.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-400">
                        {u.first_name?.charAt(0) || u.email?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">
                          {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}
                        </p>
                        <p className="text-xs text-zinc-600 truncate">{u.role}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600 shrink-0">{timeAgo(u.created_at)}</span>
                  </div>
                </Panel>
              ))}
            </div>
          </div>

          {/* Recent question reviews */}
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3">Recent Question Reviews</h3>
            {activity.recent_questions.length === 0 ? (
              <Panel className="py-8 text-center">
                <p className="text-sm text-zinc-500">No recent reviews.</p>
              </Panel>
            ) : (
              <div className="space-y-2">
                {activity.recent_questions.map((q: any) => (
                  <Panel key={q.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {q.approval_status === "APPROVED"
                        ? <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                        : <XCircle size={14} className="text-red-400 shrink-0" />}
                      <span className="text-sm text-white truncate flex-1">{q.title}</span>
                      <span className="text-xs text-zinc-600 shrink-0">{timeAgo(q.updated_at)}</span>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

