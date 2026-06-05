import { useState } from "react";

const phases = [
  {
    id: 1,
    code: "P1",
    title: "Foundation",
    weeks: "Weeks 1–3",
    color: "#185FA5",
    bg: "#E6F1FB",
    darkBg: "#0C447C",
    accent: "#B5D4F4",
    tasks: [
      { title: "Auth system", detail: "Register (student + teacher applicant), login, JWT + refresh token rotation, logout, forgot password" },
      { title: "4-role model", detail: "STUDENT → PENDING_TEACHER → TEACHER → ADMIN. Role resolved server-side from DB — never trusted from client." },
      { title: "Teacher approval flow", detail: "Teacher applies → stored as PENDING_TEACHER → Admin reviews → approved/rejected → role upgraded to TEACHER + Resend email" },
      { title: "Email OTP verification", detail: "OTP sent via Resend on registration. Teacher applications must verify email before admin review queue." },
      { title: "Prisma schema + Neon PostgreSQL", detail: "Full schema: users, teacher_applications, exams, subjects, chapters, topics, assets, questions, tests, test_questions, attempts, responses, challenges, notifications, user_stats, daily_activity, leaderboard tables" },
      { title: "Dashboard shell (3 roles)", detail: "Skeleton dashboards for Student, Teacher, Admin — routes protected by role middleware in NestJS + Next.js middleware" },
      { title: "CI/CD: GitHub Actions → Vercel + Railway", detail: "Frontend auto-deploys to Vercel on main branch push. Backend deploys to Railway via Docker. Secrets via GitHub Actions env." },
      { title: "Sentry + structured logging from day one", detail: "Winston (structured JSON logs) + OpenTelemetry traces + Sentry for errors. No debugging in production blind." },
    ],
    risks: ["JWT secret rotation strategy needed before launch", "Email deliverability — Resend domain verification must be done early"],
    deliverable: "Working login → role-gated dashboard. Teacher can apply. Admin can approve."
  },
  {
    id: 2,
    code: "P2",
    title: "Content engine",
    weeks: "Weeks 4–6",
    color: "#0F6E56",
    bg: "#E1F5EE",
    darkBg: "#085041",
    accent: "#9FE1CB",
    tasks: [
      { title: "Question bank — block model", detail: "Question content stored as content_json with blocks: [{type:'TEXT'}, {type:'LATEX'}, {type:'IMAGE',asset_id}]. Supports all 10 question types without schema changes." },
      { title: "Tiptap + KaTeX equation editor", detail: "Tiptap v3 rich text editor for question body and solutions. Custom KaTeX extension for inline/block equations. Teacher never writes raw JSON." },
      { title: "Asset upload to Cloudflare R2", detail: "Presigned URL upload flow — browser uploads directly to R2, backend stores CDN URL in assets table. Sharp for image optimisation on upload." },
      { title: "Test creation with sections + schedule windows", detail: "Tests have sections (section_config JSON), start_time/end_time fields. Competitive exams need scheduling — 'publish immediately' is not enough." },
      { title: "Test series — named bundled groups", detail: "Group tests under a named series (e.g. 'JEE Mock Series 2025') for cohort-style progress tracking." },
      { title: "Bulk question import via CSV/XLSX", detail: "CSV/XLSX with block-model mapping. Huge productivity win for teachers migrating existing question banks. Parse + validate + preview before import." },
      { title: "Solution builder with step editor", detail: "Step-by-step solution builder. Each step is a block array. Teacher adds text blocks, LaTeX blocks, and image uploads per step." },
      { title: "Question versioning on every edit", detail: "Every edit creates a version snapshot. Essential when a teacher revises an answer key post-challenge — old attempts retain the original answer key hash." },
    ],
    risks: ["Block model needs thorough validation — bad JSON = broken question rendering", "Tiptap KaTeX extension complexity — budget time for edge cases with complex equations"],
    deliverable: "Teacher can create questions with equations + images, build tests with sections, schedule windows, and import bulk questions."
  },
  {
    id: 3,
    code: "P3",
    title: "Test engine",
    weeks: "Weeks 7–9",
    color: "#3B6D11",
    bg: "#EAF3DE",
    darkBg: "#27500A",
    accent: "#C0DD97",
    tasks: [
      { title: "Full test payload API — single query", detail: "GET /tests/:id/payload returns the ENTIRE test: all questions + blocks + options + section config. One query, no N+1. Students never wait per question." },
      { title: "Dexie.js — IndexedDB on test start", detail: "On Start Test, payload stored to IndexedDB via Dexie.js. All subsequent navigation (next/prev/palette) reads from local store. Zero server round-trips." },
      { title: "Local navigation via Zustand", detail: "Test session state in Zustand: current question index, answer map, review flags, timer offset. All instant." },
      { title: "Debounced autosave + offline sync queue", detail: "Answers saved to server with 1.5s debounce. If offline, mutations queued via Background Sync API and replayed when connection restores." },
      { title: "Service worker offline resilience", detail: "Workbox precaches test shell. If network drops mid-test, student continues seamlessly. Answers sync on reconnect." },
      { title: "Timer: local clock + server verify on submit", detail: "Timer runs entirely client-side (no server ping per tick). On submit, server checks: submitted_at - started_at ≤ duration_minutes + 30s grace. Prevents server-side time manipulation." },
      { title: "Anti-cheat layer", detail: "Tab-switch detection via visibilitychange event (logged to anti_cheat_events). Focus-loss tracking. Copy-paste prevention on question text. Time-per-question logged to response.time_on_question." },
      { title: "Keyboard shortcuts — 1–4, N/P, M", detail: "Keys 1-4 select MCQ options. N = next question, P = previous, M = mark for review. Essential for 3-hour exam sessions." },
    ],
    risks: ["IndexedDB quota limits on low-storage devices — warn user if test payload > 5MB", "Safari service worker behaviour differs — test on iOS Safari explicitly"],
    deliverable: "Student can start a test, navigate instantly with zero spinners, take it offline, and submit with auto-verify."
  },
  {
    id: 4,
    code: "P4",
    title: "Scoring + results",
    weeks: "Weeks 10–11",
    color: "#BA7517",
    bg: "#FAEEDA",
    darkBg: "#633806",
    accent: "#FAC775",
    tasks: [
      { title: "Score engine — all question types", detail: "Scoring logic per type: single-correct, multiple-correct (partial marks), numerical (tolerance), true/false, matching. Configurable per test via section_config." },
      { title: "Section-level marking config", detail: "section_config JSON on test_questions stores per-section marks/negative_marks overrides. JEE/NEET sections have different marking schemes — this handles it cleanly." },
      { title: "BullMQ score jobs + retry + dead-letter queue", detail: "Score calculation runs in BullMQ worker, not inline. Retry policy: 3 attempts with exponential backoff. Dead-letter queue + Sentry alert on failure. Silent fails corrupt leaderboards." },
      { title: "Result page with full breakdown", detail: "Shows: total score, percentile, section scores, time taken, question-by-question status (correct/wrong/skipped), marks breakdown." },
      { title: "Solution viewer — blocks + equations", detail: "KaTeX renders LaTeX in solution steps. Images from Cloudflare R2 CDN. Step-by-step collapsible sections." },
      { title: "Practice mode — untimed + hints", detail: "Separate mode flag on attempt creation. No timer, hints enabled (hint_blocks in question JSON), unlimited reattempts. UI adapts." },
      { title: "Reattempt logic", detail: "attempt_no increments on reattempt. First attempt stats vs reattempt stats tracked separately in user_stats for honest analytics." },
      { title: "Initial rank calculation", detail: "After scoring, BullMQ rank job calculates rank among all attempts of this test. Stored on attempt.rank." },
    ],
    risks: ["Partial marks for multiple-correct MCQ needs careful spec — clarify with stakeholders before building", "Score job failures must not leave attempt in PENDING state — timeout fallback needed"],
    deliverable: "Students see full scored results, solution steps with equations, rank among peers, and can enter practice mode."
  },
  {
    id: 5,
    code: "P5",
    title: "Gamification",
    weeks: "Weeks 12–13",
    color: "#993C1D",
    bg: "#FAECE7",
    darkBg: "#712B13",
    accent: "#F5C4B3",
    tasks: [
      { title: "Daily streak system", detail: "On qualifying activity (test attempt or daily quiz), check daily_activity for today's date. If absent, insert row + increment user_stats.current_streak. If current_streak broken, reset to 1." },
      { title: "Weekly + monthly leaderboards", detail: "weekly_leaderboard and monthly_leaderboard tables. Score = weighted sum of accuracy + tests_attempted + score_percentile." },
      { title: "Redis leaderboard precompute + snapshot", detail: "BullMQ job runs every 15 min: fetch top-1000, compute ranks, write to Redis sorted set + leaderboard_snapshots. Dashboard reads from Redis — never from raw tables." },
      { title: "Badges + milestones", detail: "Badge system: first test, 7-day streak, 30-day streak, top-10 percentile, 100 tests. Stored as JSON flags in user_stats.badges_json." },
      { title: "Rank movement notifications", detail: "When rank changes by ±5 positions, BullMQ notification job enqueues: email via Resend + Socket.io in-app push to that user's room." },
      { title: "Socket.io real-time rank updates", detail: "Per-user Socket.io room: user:{userId}. Server emits rank_update event after each leaderboard recompute. Client shows animated rank pill." },
      { title: "Streak recovery / grace period logic", detail: "7-day streaks: 1 grace day allowed per 7-day window. If missed yesterday but not the day before, don't break streak — give one chance." },
      { title: "Leaderboard archive to DB", detail: "Every Sunday midnight: Redis leaderboard snapshot archived to leaderboard_snapshots table. Allows historical rank tracking." },
    ],
    risks: ["Streak timezone handling — store all times in UTC, display in user's local timezone", "Redis eviction policy — set allkeys-lru or use Upstash TTL to prevent stale data"],
    deliverable: "Students have streaks, see live leaderboards, get notified of rank changes, and earn badges."
  },
  {
    id: 6,
    code: "P6",
    title: "Challenge system",
    weeks: "Weeks 14–15",
    color: "#533AB7",
    bg: "#EEEDFE",
    darkBg: "#3C3489",
    accent: "#AFA9EC",
    tasks: [
      { title: "Challenge form with reason categories", detail: "Reasons: wrong answer key, ambiguous question, wrong explanation, typo, unclear wording, other. Plus free-text description + optional screenshot attachment." },
      { title: "Auto-route to question creator", detail: "On challenge creation: assigned_to = question.created_by. NestJS ChallengeService resolves creator and inserts challenge with PENDING status." },
      { title: "Teacher review panel", detail: "Teacher sees all PENDING challenges assigned to them. Can view: original question, student's response, challenge reason + description." },
      { title: "Accept / reject / revise answer key", detail: "Accept: mark challenge RESOLVED, no content change. Reject: mark REJECTED with rejection_note. Revise: update question.solution_json or answer key (triggers question versioning)." },
      { title: "Admin escalation path", detail: "Teacher can escalate to admin. Admin escalation queue in admin dashboard. Admin has full override on any challenge." },
      { title: "Question versioning on key revision", detail: "When answer key revised post-challenge: old version snapshot preserved. Attempts scored under old key remain valid — no retroactive rescoring." },
      { title: "Email notifications via Resend", detail: "On challenge created: email to assigned teacher. On challenge resolved: email to student with resolution note." },
      { title: "In-app notifications via Socket.io", detail: "Challenge events pushed to teacher's Socket.io room in real time. Red dot on challenge tab for unread count." },
    ],
    risks: ["Retroactive rescoring decision — decide policy upfront (don't rescore, or rescore affected attempts)", "Challenge spam — rate-limit challenge submissions per user per test"],
    deliverable: "Full challenge lifecycle: student submits → teacher reviews → accepts/revises/escalates → student notified."
  },
  {
    id: 7,
    code: "P7",
    title: "Analytics + AI",
    weeks: "Weeks 16–17",
    color: "#0F6E56",
    bg: "#E1F5EE",
    darkBg: "#085041",
    accent: "#9FE1CB",
    tasks: [
      { title: "Student analytics dashboard — Recharts", detail: "Charts: accuracy over time, score trend, time-per-question distribution, subject-wise breakdown, first attempt vs reattempt improvement curves." },
      { title: "Weak topic detection", detail: "Query responses grouped by topic_id. Topics with accuracy < 50% and ≥5 attempts flagged as weak. Displayed as a prioritised study list." },
      { title: "Performance trend charts", detail: "30-day rolling accuracy, score percentile movement, streak history calendar (like GitHub contribution graph)." },
      { title: "Teacher dashboard + challenge metrics", detail: "Tests created, live challenge count, resolution rate, average score per test, top-missed questions per test." },
      { title: "Admin dashboard + platform health", detail: "Pending teacher approvals, total users, DAU/WAU/MAU, challenge resolution rate, system: API latency p50/p95, error rate, Railway/Neon metrics." },
      { title: "AI study plan — Claude API integration", detail: "Claude API call with: student's weak topics + accuracy per topic + attempt history. Returns a personalised 2-week study plan. Cached per student per week." },
      { title: "Dark mode + font size controls", detail: "Dark mode via Tailwind dark class + localStorage preference. Font size: 3 levels (small/medium/large) for accessibility. Persisted to user_stats.preferences_json." },
      { title: "Mobile UX polish + accessibility pass", detail: "Touch targets ≥ 44px on all interactive elements. KaTeX equations on mobile: horizontal scroll on overflow. ARIA labels on all icon buttons. Screen reader test pass." },
    ],
    risks: ["Claude API costs — cache study plans, don't regenerate on every dashboard load", "Heavy analytics queries — add materialized views or Redis cache for dashboard summaries"],
    deliverable: "Full analytics for all 3 roles. AI-powered study plan. Dark mode. Mobile-polished."
  },
  {
    id: 8,
    code: "P8",
    title: "Scale + hardening",
    weeks: "Weeks 18–20",
    color: "#444441",
    bg: "#F1EFE8",
    darkBg: "#2C2C2A",
    accent: "#D3D1C7",
    tasks: [
      { title: "Redis caching for all hot paths", detail: "Cache: test payloads (TTL 1h), leaderboard data (TTL 15min), dashboard summaries (TTL 5min), user stats (TTL 2min). Cache-aside pattern with invalidation on writes." },
      { title: "Per-endpoint rate limiting", detail: "rate-limiter-flex + Redis store. Login: 5/min. Challenge submit: 3/test. Question create: 50/hour. Auth routes: strictest limits." },
      { title: "k6 load testing — 1,000 concurrent target", detail: "k6 scripts for: 1000 concurrent test-takers (read-heavy), 500 concurrent submits (write spike), leaderboard page (Redis-cached read). Target: p95 < 500ms." },
      { title: "DB index + partition audit", detail: "Add composite indexes: (user_id, test_id) on attempts; (attempt_id, question_id) on responses; (user_id, activity_date) on daily_activity. Partition responses by month if > 10M rows." },
      { title: "BullMQ dead-letter + retry policy review", detail: "All jobs: maxAttempts: 3, backoff: exponential. Dead-letter queues alert to Sentry. Score jobs: priority queue — higher priority than notification jobs." },
      { title: "OpenTelemetry distributed tracing", detail: "Trace spans across: Next.js → NestJS → Prisma → Redis. Use Jaeger or Grafana Tempo for trace storage. Identify N+1 queries and slow spans." },
      { title: "Security audit + pen testing", detail: "OWASP top-10 review. Prisma parameterised queries (no SQL injection). Helmet.js headers. CORS policy tightened. JWT expiry + refresh rotation audit. File upload MIME validation." },
      { title: "Audit logs for all state-changing ops", detail: "Every: teacher approval/rejection, answer key revision, challenge resolution, admin override — written to audit_log table with actor_id, action, entity_type, entity_id, before/after JSON." },
    ],
    risks: ["Load testing may expose Neon serverless cold-start latency — consider connection pooling via PgBouncer", "Redis memory sizing — profile real leaderboard snapshot sizes before setting Upstash plan limits"],
    deliverable: "Platform handles 1,000 concurrent users. All hot paths cached. Security hardened. Full observability."
  }
];

const stack = {
  Frontend: [
    { cat: "Core framework", items: ["Next.js 15 — App Router + PPR", "TypeScript 5 strict", "React 19"] },
    { cat: "Styling & UI", items: ["Tailwind CSS v4", "shadcn/ui (Radix-based)", "Framer Motion v11"] },
    { cat: "State & data", items: ["TanStack Query v5", "Zustand v5", "Dexie.js — IndexedDB"] },
    { cat: "Test engine UX", items: ["KaTeX — math rendering", "Tiptap v3 — question editor", "React Hook Form + Zod", "Recharts — analytics"] },
    { cat: "Offline & PWA", items: ["next-pwa", "Workbox (cache strategies)", "Background Sync API"] },
  ],
  Backend: [
    { cat: "API framework", items: ["NestJS — TypeScript, DI modules", "Prisma v6 ORM", "Zod v3 — validation"] },
    { cat: "Realtime & jobs", items: ["Socket.io v4", "BullMQ v5 — job queues + DLQ", "Passport.js + JWT + refresh tokens"] },
    { cat: "Security & media", items: ["Helmet.js", "rate-limiter-flex", "Sharp — image optimisation", "Winston + OpenTelemetry"] },
  ],
  Infrastructure: [
    { cat: "Compute & deploy", items: ["Vercel — Next.js + Edge functions", "Railway — NestJS containers", "Docker"] },
    { cat: "Data & storage", items: ["Neon — PostgreSQL serverless", "Upstash — Redis serverless", "Cloudflare R2 — object storage"] },
    { cat: "Monitoring & email", items: ["Resend — transactional email", "Sentry — errors + performance", "Checkly — uptime + E2E checks"] },
  ]
};

export default function ExamPlatformPlan() {
  const [activePhase, setActivePhase] = useState(0);
  const [tab, setTab] = useState("phases");
  const [expandedTask, setExpandedTask] = useState(null);

  const phase = phases[activePhase];

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", padding: "1rem 0" }}>
      <h2 className="sr-only">AI-ready competitive exam platform — implementation plan</h2>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: "0.75rem" }}>
        {["phases", "stack", "timeline"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? "var(--color-background-secondary)" : "transparent",
              border: "0.5px solid",
              borderColor: tab === t ? "var(--color-border-secondary)" : "transparent",
              borderRadius: "var(--border-radius-md)",
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: tab === t ? 500 : 400,
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              cursor: "pointer",
              textTransform: "capitalize"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "phases" && (
        <>
          {/* Phase selector */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: "1.25rem" }}>
            {phases.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setActivePhase(i); setExpandedTask(null); }}
                style={{
                  background: activePhase === i ? p.bg : "transparent",
                  border: `0.5px solid ${activePhase === i ? p.color + "66" : "var(--color-border-tertiary)"}`,
                  borderRadius: "var(--border-radius-md)",
                  padding: "8px 4px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 500, color: activePhase === i ? p.color : "var(--color-text-secondary)" }}>{p.code}</div>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2, lineHeight: 1.3 }}>{p.title}</div>
              </button>
            ))}
          </div>

          {/* Phase header */}
          <div style={{
            background: phase.bg,
            border: `0.5px solid ${phase.color}44`,
            borderRadius: "var(--border-radius-lg)",
            padding: "1rem 1.25rem",
            marginBottom: "1rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: phase.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{phase.code} · {phase.weeks}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>{phase.title}</div>
              </div>
              <div style={{
                background: phase.accent + "66",
                border: `0.5px solid ${phase.color}44`,
                borderRadius: "var(--border-radius-md)",
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 500,
                color: phase.color
              }}>
                {phase.tasks.length} tasks
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
            {phase.tasks.map((task, i) => (
              <button
                key={i}
                onClick={() => setExpandedTask(expandedTask === i ? null : i)}
                style={{
                  background: "var(--color-background-primary)",
                  border: `0.5px solid ${expandedTask === i ? phase.color + "55" : "var(--color-border-tertiary)"}`,
                  borderLeft: `2.5px solid ${phase.color}`,
                  borderRadius: "var(--border-radius-md)",
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "border-color 0.15s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{task.title}</div>
                  <div style={{ fontSize: 16, color: "var(--color-text-tertiary)", marginLeft: 8, flexShrink: 0 }}>
                    {expandedTask === i ? "−" : "+"}
                  </div>
                </div>
                {expandedTask === i && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 8 }}>
                    {task.detail}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Risks */}
          <div style={{
            background: "#FAEEDA",
            border: "0.5px solid #BA751744",
            borderRadius: "var(--border-radius-md)",
            padding: "0.75rem 1rem",
            marginBottom: "0.75rem"
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#BA7517", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>⚠ Risks to flag</div>
            {phase.risks.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: "#633806", lineHeight: 1.6, paddingLeft: 8, borderLeft: "2px solid #EF9F2766", marginBottom: i < phase.risks.length - 1 ? 6 : 0 }}>
                {r}
              </div>
            ))}
          </div>

          {/* Deliverable */}
          <div style={{
            background: "#EAF3DE",
            border: "0.5px solid #3B6D1144",
            borderRadius: "var(--border-radius-md)",
            padding: "0.75rem 1rem"
          }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#3B6D11", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>✓ Phase deliverable</div>
            <div style={{ fontSize: 12, color: "#27500A", lineHeight: 1.6 }}>{phase.deliverable}</div>
          </div>
        </>
      )}

      {tab === "stack" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {Object.entries(stack).map(([layer, cats]) => (
            <div key={layer}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{layer}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cats.map(cat => (
                  <div key={cat.cat} style={{
                    background: "var(--color-background-primary)",
                    border: "0.5px solid var(--color-border-tertiary)",
                    borderRadius: "var(--border-radius-md)",
                    padding: "10px 12px"
                  }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat.cat}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {cat.items.map(item => (
                        <span key={item} style={{
                          background: "var(--color-background-secondary)",
                          border: "0.5px solid var(--color-border-tertiary)",
                          borderRadius: "var(--border-radius-md)",
                          padding: "3px 8px",
                          fontSize: 12,
                          color: "var(--color-text-primary)"
                        }}>{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "timeline" && (
        <div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            20 weeks total. Each bar represents 1 week. Phases overlap intentionally — testing and integration run alongside build.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {phases.map((p) => {
              const weeksText = p.weeks.replace("Weeks ", "");
              const [start, end] = weeksText.split("–").map(Number);
              const totalWeeks = 20;
              const left = ((start - 1) / totalWeeks) * 100;
              const width = ((end - start + 1) / totalWeeks) * 100;
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: p.color, minWidth: 24 }}>{p.code}</div>
                  <div style={{ flex: 1, height: 28, background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", position: "relative", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute",
                      left: `${left}%`,
                      width: `${width}%`,
                      top: 0,
                      bottom: 0,
                      background: p.bg,
                      borderRadius: "var(--border-radius-md)",
                      border: `0.5px solid ${p.color}66`,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: p.color, whiteSpace: "nowrap" }}>{p.title}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", minWidth: 52, textAlign: "right" }}>W{start}–W{end}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {[
              { label: "Total phases", value: "8" },
              { label: "Total weeks", value: "20" },
              { label: "Total tasks", value: phases.reduce((a, p) => a + p.tasks.length, 0).toString() },
              { label: "Est. team size", value: "3–5 devs" }
            ].map(stat => (
              <div key={stat.label} style={{
                background: "var(--color-background-secondary)",
                borderRadius: "var(--border-radius-md)",
                padding: "0.75rem 1rem"
              }}>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 500 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
