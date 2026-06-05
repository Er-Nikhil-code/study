"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/auth.service";

type Role = "STUDENT" | "PENDING_TEACHER" | "TEACHER" | "ADMIN";

type UserShape = {
  id?: string;
  email?: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  role?: Role;
};


const teacherMenu = [
  "Overview",
  "Questions",
  "Tests",
  "Challenges",
  "Analytics",
  "Students",
];
const adminMenu = [
  "Overview",
  "Approvals",
  "Users",
  "Health",
  "Challenges",
  "Audit Logs",
];

const roadmap = [
  {
    code: "P1",
    title: "Foundation",
    progress: 100,
    accent: "#ef4444",
    summary:
      "Auth, role gating, OTP verification, schema, and deployment plumbing.",
    deliverable: "Login, registration, and protected dashboards are working.",
  },
  {
    code: "P2",
    title: "Content engine",
    progress: 72,
    accent: "#f97316",
    summary: "Question bank, editor, asset upload, and bulk import.",
    deliverable:
      "Teachers can create rich questions with equations and images.",
  },
  {
    code: "P3",
    title: "Test engine",
    progress: 58,
    accent: "#eab308",
    summary:
      "Offline-first test runtime with IndexedDB, autosave, and timer safety.",
    deliverable:
      "Students can take tests smoothly, even with weak connectivity.",
  },
  {
    code: "P4",
    title: "Scoring + results",
    progress: 44,
    accent: "#22c55e",
    summary:
      "Deterministic scoring, full breakdowns, ranking, and practice mode.",
    deliverable: "Students receive scored results with solutions and ranks.",
  },
  {
    code: "P5",
    title: "Gamification",
    progress: 33,
    accent: "#06b6d4",
    summary:
      "Streaks, badges, leaderboards, live notifications, and achievements.",
    deliverable: "Students see progress, streaks, and a live competitive loop.",
  },
  {
    code: "P6",
    title: "Challenge system",
    progress: 28,
    accent: "#8b5cf6",
    summary: "Teacher review workflow for disputed answers and explanations.",
    deliverable: "Students can challenge content and get resolved outcomes.",
  },
  {
    code: "P7",
    title: "Analytics + AI",
    progress: 19,
    accent: "#14b8a6",
    summary:
      "Charts, weak-topic detection, platform metrics, and AI study plans.",
    deliverable: "All roles get actionable analytics and guidance.",
  },
  {
    code: "P8",
    title: "Scale + hardening",
    progress: 12,
    accent: "#94a3b8",
    summary:
      "Caching, rate limiting, load tests, tracing, and security review.",
    deliverable:
      "The platform is ready for real traffic and production growth.",
  },
];

const studentStats = [
  { label: "Tests Attempted", value: "24", hint: "+5 this month" },
  { label: "Accuracy", value: "87%", hint: "+7% vs last week" },
  { label: "Current Rank", value: "#142", hint: "Up 18 spots" },
  { label: "Study Streak", value: "18 Days", hint: "1 grace day left" },
];

const teacherStats = [
  { label: "Questions Created", value: "318", hint: "22 edited this week" },
  { label: "Active Tests", value: "14", hint: "3 scheduled windows" },
  { label: "Pending Challenges", value: "6", hint: "2 urgent" },
  { label: "Approval Rate", value: "94%", hint: "Across recent submissions" },
];

const adminStats = [
  { label: "Pending Teachers", value: "8", hint: "4 verified profiles" },
  { label: "DAU", value: "1.8k", hint: "+12% week-over-week" },
  { label: "API p95", value: "214ms", hint: "Within target" },
  { label: "Error Rate", value: "0.2%", hint: "No critical incidents" },
];

const studentActions = [
  "Start a mock test",
  "Continue practice mode",
  "Review last attempt",
];

const teacherActions = [
  "Create a new question",
  "Review challenges",
  "Publish test series",
];

const adminActions = [
  "Review teacher applications",
  "Inspect system health",
  "Audit recent changes",
];

const studentAlerts = [
  {
    title: "Weak topic detected",
    detail: "Probability: 42% accuracy across 7 attempts.",
  },
  {
    title: "New rank movement",
    detail: "You moved up 18 places after the latest test.",
  },
];

const teacherAlerts = [
  {
    title: "Challenge queue",
    detail: "3 unresolved questions need your attention.",
  },
  {
    title: "Content versioning",
    detail: "One answer key revision is awaiting confirmation.",
  },
];

const adminAlerts = [
  { title: "Approval queue", detail: "Two teacher applications are waiting." },
  { title: "Observability", detail: "Monitor one slow worker job in BullMQ." },
];

const quickLinks = {
  STUDENT: [
    "Dashboard",
    "Tests",
    "Practice",
    "Results",
    "Leaderboard",
    "Study Plan",
  ],
  PENDING_TEACHER: ["Profile", "Application", "Status", "Guidelines"],
  TEACHER: teacherMenu,
  ADMIN: adminMenu,
} as const;

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-red-900/25 bg-red-950/10 p-5 shadow-[0_0_0_1px_rgba(239,68,68,0.04)] backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-[0.22em] text-gray-400">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
      <div className="mt-1 text-sm text-gray-400">{hint}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-red-600/20 bg-red-600/10 px-3 py-1 text-xs font-medium text-red-300">
      {children}
    </span>
  );
}

function MenuItem({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
        active
          ? "border border-red-600/25 bg-red-600 text-white shadow-lg shadow-red-950/20"
          : "border border-transparent bg-white/0 text-gray-400 hover:border-red-900/20 hover:bg-red-950/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function RoadmapRow({
  item,
  selected,
  onClick,
}: {
  item: (typeof roadmap)[number];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition hover:border-red-500/30 ${
        selected
          ? "border-red-500/30 bg-white/6"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: item.accent }}
          >
            {item.code}
          </div>
          <div className="mt-1 text-lg font-semibold text-white">
            {item.title}
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-gray-300">
          {item.progress}%
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-gray-400">{item.summary}</p>
      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full"
          style={{ width: `${item.progress}%`, backgroundColor: item.accent }}
        />
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserShape | null>(null);
  const [selectedPhase, setSelectedPhase] = useState(0);

  useEffect(() => {
    const token = authService.getAccessToken();
    const currentUser = authService.getUser() as UserShape | null;

    if (!token || !currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
  }, [router]);

  const role = (user?.role || "STUDENT") as Role;

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.first_name || user.firstName || "User";
  }, [user]);

  const dashboardTitle =
    role === "TEACHER"
      ? "Teacher dashboard"
      : role === "ADMIN"
        ? "Admin dashboard"
        : role === "PENDING_TEACHER"
          ? "Teacher application dashboard"
          : "Student dashboard";

  const dashboardSubtitle =
    role === "TEACHER"
      ? "Manage questions, tests, challenges, and content quality."
      : role === "ADMIN"
        ? "Oversee approvals, platform health, and release readiness."
        : role === "PENDING_TEACHER"
          ? "Complete your application and track approval status."
          : "Focus on practice, speed, weak topics, and result trends.";

  const stats =
    role === "TEACHER"
      ? teacherStats
      : role === "ADMIN"
        ? adminStats
        : studentStats;

  const actions =
    role === "TEACHER"
      ? teacherActions
      : role === "ADMIN"
        ? adminActions
        : studentActions;

  const alerts =
    role === "TEACHER"
      ? teacherAlerts
      : role === "ADMIN"
        ? adminAlerts
        : studentAlerts;

  const menu = quickLinks[role];
  const selected = roadmap[selectedPhase];

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="rounded-3xl border border-red-900/25 bg-red-950/10 px-6 py-5 text-sm text-gray-300 shadow-2xl shadow-red-950/10">
            Loading dashboard...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-red-900/20 bg-black/75 backdrop-blur-xl lg:w-80 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col p-6 lg:p-8">
            <div>
              <div className="text-3xl font-bold tracking-tight">
                <span className="text-white">Study</span>
                <span className="ml-2 text-red-500">Platform</span>
              </div>
              <div className="mt-2 h-1.5 w-24 rounded-full bg-gradient-to-r from-red-600 to-red-400" />
            </div>

            <div className="mt-8 rounded-3xl border border-red-900/25 bg-red-950/10 p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                Signed in as
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {displayName}
              </div>
              <div className="mt-2 text-sm text-gray-400">
                {user.email || "No email found"}
              </div>
              <div className="mt-4">
                <Pill>{role.replace("_", " ")}</Pill>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              {menu.map((item, index) => (
                <MenuItem key={item} active={index === 0}>
                  {item}
                </MenuItem>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-red-900/20 bg-white/[0.03] p-4 text-sm text-gray-400">
              <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                Auth
              </div>
              <div className="mt-2 leading-6">
                Tokens are loaded from localStorage and your user object comes
                from the last successful login or OTP verification.
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={() => {
                  authService.logout();
                  window.location.href = "/";
                }}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 overflow-hidden">
          <div className="border-b border-red-900/20 bg-white/[0.03] px-5 py-6 backdrop-blur-xl lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.22em] text-gray-500">
                  {role === "STUDENT"
                    ? "Student view"
                    : role === "TEACHER"
                      ? "Teacher view"
                      : role === "ADMIN"
                        ? "Admin view"
                        : "Pending teacher view"}
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white lg:text-4xl">
                  {dashboardTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 lg:text-base">
                  {dashboardSubtitle}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Pill>{user.email || "verified user"}</Pill>
                <Pill>Role: {role.replace("_", " ")}</Pill>
                <Pill>Route: /dashboard</Pill>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 lg:grid-cols-12 lg:px-8">
            <div className="space-y-6 lg:col-span-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-red-900/25 bg-white/[0.04] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                        Next actions
                      </div>
                      <h2 className="mt-1 text-xl font-semibold text-white">
                        What to do now
                      </h2>
                    </div>
                    <Pill>
                      {role === "STUDENT"
                        ? "Practice"
                        : role === "TEACHER"
                          ? "Content"
                          : role === "ADMIN"
                            ? "Operations"
                            : "Application"}
                    </Pill>
                  </div>

                  <div className="mt-4 space-y-3">
                    {actions.map((action) => (
                      <div
                        key={action}
                        className="rounded-2xl border border-red-900/20 bg-black/20 p-4"
                      >
                        <div className="font-medium text-white">{action}</div>
                        <div className="mt-1 text-sm leading-6 text-gray-400">
                          {role === "STUDENT" &&
                            action === "Start a mock test" &&
                            "Launch the next available timed test with offline-first runtime."}
                          {role === "STUDENT" &&
                            action === "Continue practice mode" &&
                            "Resume untimed revision on weak chapters with unlimited retries."}
                          {role === "STUDENT" &&
                            action === "Review last attempt" &&
                            "Open the solution viewer and compare answers."}

                          {role === "TEACHER" &&
                            action === "Create a new question" &&
                            "Use the block-based editor with LaTeX and image blocks."}
                          {role === "TEACHER" &&
                            action === "Review challenges" &&
                            "Resolve disputes and revise answer keys when required."}
                          {role === "TEACHER" &&
                            action === "Publish test series" &&
                            "Bundle tests into a cohort-ready series with scheduled windows."}

                          {role === "ADMIN" &&
                            action === "Review teacher applications" &&
                            "Approve or reject applicants in the pending queue."}
                          {role === "ADMIN" &&
                            action === "Inspect system health" &&
                            "Check deploys, latency, queue status, and platform errors."}
                          {role === "ADMIN" &&
                            action === "Audit recent changes" &&
                            "Review moderation actions, revisions, and overrides."}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-red-900/25 bg-white/[0.04] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                        Alerts
                      </div>
                      <h2 className="mt-1 text-xl font-semibold text-white">
                        Important signals
                      </h2>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.title}
                        className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4"
                      >
                        <div className="font-medium text-amber-200">
                          {alert.title}
                        </div>
                        <div className="mt-1 text-sm leading-6 text-gray-300">
                          {alert.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-red-900/25 bg-white/[0.04] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                      Roadmap
                    </div>
                    <h2 className="mt-1 text-xl font-semibold text-white">
                      Eight-phase build plan
                    </h2>
                  </div>
                  <div className="text-sm text-gray-400">20 weeks total</div>
                </div>

                <div className="mt-5 grid gap-3">
                  {roadmap.map((item, idx) => (
                    <RoadmapRow
                      key={item.code}
                      item={item}
                      selected={idx === selectedPhase}
                      onClick={() => setSelectedPhase(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6 lg:col-span-4">
              <div className="rounded-3xl border border-red-900/25 bg-white/[0.04] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                  Selected phase
                </div>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  {selected.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  {selected.summary}
                </p>

                <div className="mt-5 rounded-2xl border border-red-900/20 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                    Deliverable
                  </div>
                  <div className="mt-1 text-sm font-medium text-white">
                    {selected.deliverable}
                  </div>
                </div>

                <div className="mt-4 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${selected.progress}%`,
                      backgroundColor: selected.accent,
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                  <span>Progress</span>
                  <span className="font-medium text-white">
                    {selected.progress}%
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-red-900/25 bg-white/[0.04] p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                  Stack overview
                </div>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Frontend · Backend · Infra
                </h2>

                <div className="mt-4 space-y-4 text-sm leading-6 text-gray-400">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="font-medium text-red-300">Frontend</div>
                    Next.js, TypeScript, Tailwind, shadcn/ui, Zustand, TanStack
                    Query, Dexie, KaTeX, Tiptap, Recharts.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="font-medium text-emerald-300">Backend</div>
                    NestJS, Prisma, JWT, Socket.io, BullMQ, Winston,
                    OpenTelemetry, rate limiting, and secure email delivery.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="font-medium text-cyan-300">Infra</div>
                    Vercel, Railway, Neon Postgres, Upstash Redis, Cloudflare
                    R2, Sentry, and Checkly.
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-red-900/25 bg-gradient-to-br from-red-600/10 via-black to-red-950/20 p-6">
                <div className="text-xs uppercase tracking-[0.22em] text-gray-500">
                  Note
                </div>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Role-aware by design
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  This dashboard reads the logged-in user from localStorage,
                  redirects unauthenticated users to login, and switches content
                  based on STUDENT, TEACHER, ADMIN, or PENDING_TEACHER.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
