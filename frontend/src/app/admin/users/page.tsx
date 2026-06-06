import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";

const navItems = [
  { label: "Admin home", href: "/admin" },
  { label: "Approvals", href: "/admin/approvals" },
  { label: "Users", href: "/admin/users" },
  { label: "Challenges", href: "/admin/challenges" },
  { label: "System", href: "/admin/system" },
];

const users = [
  {
    name: "Aarav Sharma",
    role: "Student",
    email: "aarav@example.com",
    status: "Active",
  },
  {
    name: "Priya Nair",
    role: "Teacher",
    email: "priya@example.com",
    status: "Active",
  },
  {
    name: "Rohan Gupta",
    role: "Pending Teacher",
    email: "rohan@example.com",
    status: "Pending",
  },
  {
    name: "Admin User",
    role: "Admin",
    email: "admin@example.com",
    status: "Active",
  },
];

export default function AdminUsersPage() {
  return (
    <DashboardShell activeHref="/admin/users" navItems={navItems}>
      <SectionTitle
        title="Users"
        subtitle="A clean admin user list that fits the existing visual system."
      />

      <Panel className="mt-6 overflow-hidden p-0">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <div>Name</div>
          <div>Role</div>
          <div>Email</div>
          <div>Status</div>
        </div>

        <div className="divide-y divide-white/10">
          {users.map((user) => (
            <div
              key={user.email}
              className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px] gap-3 px-5 py-4 text-sm"
            >
              <div className="truncate text-white">{user.name}</div>
              <div className="truncate text-zinc-300">{user.role}</div>
              <div className="truncate text-zinc-400">{user.email}</div>
              <div>
                <span
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    user.status === "Active"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-300",
                  ].join(" ")}
                >
                  {user.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </DashboardShell>
  );
}
