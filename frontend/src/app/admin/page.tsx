"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "./nav";
import adminService, { type DashboardStats } from "@/services/admin.service";

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

export default function AdminHomePage() {
  const { data: stats, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      return await adminService.getDashboardStats();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const error = queryError ? (queryError as any)?.response?.data?.message || "Failed to load stats" : null;

  return (
    <DashboardShell activeHref="/admin">
      <SectionTitle
        title="Admin Dashboard"
        subtitle="Oversight, moderation, and system health in one place."
      />

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Primary stats row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? "—"}
          loading={loading}
        />
        <StatCard
          label="Total Questions"
          value={stats?.totalQuestions ?? "—"}
          loading={loading}
        />
        <StatCard
          label="Open Challenges"
          value={stats?.openChallenges ?? "—"}
          accent={(stats?.openChallenges ?? 0) > 0}
          loading={loading}
        />
      </div>

      {/* Secondary stats row */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Students"
          value={stats?.totalStudents ?? "—"}
          loading={loading}
        />
        <StatCard
          label="Teachers"
          value={stats?.totalTeachers ?? "—"}
          loading={loading}
        />
        <StatCard
          label="Total Tests"
          value={stats?.totalTests ?? "—"}
          loading={loading}
        />
        <StatCard
          label="Total Attempts"
          value={stats?.totalAttempts ?? "—"}
          loading={loading}
        />
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <Link
          href="/admin/users"
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
        >
          <div className="text-sm font-medium text-white group-hover:text-white">
            Manage Users
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Search, edit roles, and delete user accounts
          </p>
        </Link>

        <Link
          href="/admin/roles"
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
        >
          <div className="text-sm font-medium text-white group-hover:text-white">
            Manage Roles
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Add, edit, and configure permission-based roles
          </p>
        </Link>

        <Link
          href="/admin/questions"
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
        >
          <div className="text-sm font-medium text-white group-hover:text-white">
            Manage Questions
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Browse, search, and moderate the question bank
          </p>
        </Link>

        <Link
          href="/admin/challenges"
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
        >
          <div className="text-sm font-medium text-white group-hover:text-white">
            Challenges
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Review disputed questions and answer keys
          </p>
        </Link>

        <Link
          href="/admin/system"
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06] hover:border-white/20"
        >
          <div className="text-sm font-medium text-white group-hover:text-white">
            System Health
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Monitor API performance, queues, and errors
          </p>
        </Link>
      </div>
    </DashboardShell>
  );
}
