"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";
import adminService, { type AdminUser } from "@/services/admin.service";

const ROLES = ["ALL", "STUDENT", "INTERN", "PENDING_TEACHER", "TEACHER", "ADMIN"];
const ASSIGNABLE_ROLES = ["STUDENT", "INTERN", "PENDING_TEACHER", "TEACHER", "ADMIN"];
const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [teachers, setTeachers] = useState<AdminUser[]>([]);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({
        search: search || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await adminService.getUsers({ role: "TEACHER", take: 100 });
      setTeachers(res.data);
    } catch (err) {
      console.error("Failed to load teachers", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchTeachers();
  }, [fetchUsers, fetchTeachers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      setEditingId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update role");
    }
  };

  const handleTeacherAssign = async (userId: string, teacherId: string) => {
    try {
      await adminService.updateUser(userId, { assigned_teacher_id: teacherId || null });
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign teacher");
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleteLoading(true);
    try {
      await adminService.deleteUser(userId);
      setDeletingId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "border-purple-500/20 bg-purple-500/10 text-purple-300",
      TEACHER: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      INTERN: "border-pink-500/20 bg-pink-500/10 text-pink-300",
      STUDENT: "border-red-500/20 bg-red-500/10 text-red-300",
      PENDING_TEACHER: "border-red-500/20 bg-red-500/10 text-red-300",
    };
    return (
      <span
        className={`rounded-full border px-3 py-1 text-xs font-medium ${colors[role] || "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"}`}
      >
        {role.replace("_", " ")}
      </span>
    );
  };

  return (
    <DashboardShell activeHref="/admin/users" navItems={adminNavItems}>
      <SectionTitle
        title="Users"
        subtitle={`${total} total user${total !== 1 ? "s" : ""} on the platform.`}
      />

      {/* Filters bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20"
          />
        </div>

        {/* Role filter dropdown */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none transition focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 appearance-none cursor-pointer"
          style={{ backgroundImage: "none" }}
        >
          {ROLES.map((r) => (
            <option key={r} value={r} className="bg-zinc-900 text-white">
              {r === "ALL" ? "All Roles" : r.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Users table */}
      <Panel className="mt-4 p-0 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px_100px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <div>Name</div>
          <div>Role</div>
          <div>Email</div>
          <div>Joined</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div className="divide-y divide-white/10">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px_100px] gap-3 px-5 py-4"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-12 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            No users found{search ? ` matching "${search}"` : ""}.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px_100px] gap-3 px-5 py-4 text-sm items-center"
              >
                <div className="truncate text-white">
                  {user.first_name || "—"} {user.last_name || ""}
                </div>

                {/* Role — editable */}
                <div className="flex flex-col gap-2 items-start">
                  {editingId === user.id ? (
                    <select
                      value={editRole}
                      onChange={(e) => {
                        handleRoleChange(user.id, e.target.value);
                      }}
                      onBlur={() => setEditingId(null)}
                      autoFocus
                      className="rounded-lg border border-red-500/30 bg-zinc-900 px-2 py-1 text-xs text-white outline-none"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(user.id);
                        setEditRole(user.role);
                      }}
                      className="cursor-pointer transition hover:opacity-80"
                      title="Click to change role"
                    >
                      {roleBadge(user.role)}
                    </button>
                  )}
                  {user.role === "INTERN" && (
                    <select
                      className="mt-1 rounded-md border border-white/10 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 outline-none w-full max-w-[120px]"
                      value={user.assigned_teacher_id || ""}
                      onChange={(e) => handleTeacherAssign(user.id, e.target.value)}
                    >
                      <option value="">No Teacher Assigned</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.first_name} {t.last_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="truncate text-zinc-400">{user.email}</div>

                <div className="text-xs text-zinc-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div>
                  {deletingId === user.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteLoading}
                        className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteLoading ? "…" : "Yes"}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 transition hover:text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(user.id)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </Panel>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Page {page + 1} of {totalPages} · {total} users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
