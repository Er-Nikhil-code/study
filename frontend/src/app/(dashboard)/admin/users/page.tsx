"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";
import adminService, { type AdminUser } from "@/services/admin.service";
import { getChessRoleName } from "@/lib/role";

const ROLES = ["ALL", "STUDENT", "INTERN", "TEACHER", "ADMIN"];
const ASSIGNABLE_ROLES = ["STUDENT", "INTERN", "TEACHER"];
const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Create state
  const [showAddModal, setShowAddModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "INTERN",
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { data: usersData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["admin", "users", { search, roleFilter, page }],
    queryFn: async () => {
      return await adminService.getUsers({
        search: search || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        page: page + 1,
        limit: PAGE_SIZE,
      });
    },
    placeholderData: keepPreviousData,
  });

  const { data: teachersData } = useQuery({
    queryKey: ["admin", "teachers"],
    queryFn: async () => {
      const res = await adminService.getUsers({ role: "TEACHER", limit: 100 });
      return res.data;
    },
  });

  // Ensure arrays to prevent .map crashes if API response format changes
  const rawUsers = usersData?.data || usersData;
  const users = Array.isArray(rawUsers) ? rawUsers : [];
  const total = usersData?.total || users.length || 0;
  
  const teachers = Array.isArray(teachersData) ? teachersData : Array.isArray((teachersData as any)?.data) ? (teachersData as any).data : [];
  const error = queryError ? (queryError as any)?.response?.data?.message || "Failed to load users" : null;

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
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update role");
    }
  };

  const handleTeacherAssign = async (userId: string, teacherId: string) => {
    try {
      await adminService.updateUser(userId, { assigned_teacher_id: teacherId || null });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign teacher");
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleteLoading(true);
    try {
      await adminService.deleteUser(userId);
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      // Optimistically update the UI cache
      queryClient.setQueryData(
        ["admin", "users", { search, roleFilter, page }],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((u: any) => 
              u.id === userId ? { ...u, is_active: !currentStatus } : u
            )
          };
        }
      );
      
      await adminService.updateUser(userId, { is_active: !currentStatus });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update user status");
      // Revert cache on error
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      alert("Email and password are required.");
      return;
    }
    setCreateLoading(true);
    try {
      await adminService.createUser(newUser);
      setShowAddModal(false);
      setNewUser({ first_name: "", last_name: "", email: "", password: "", role: "INTERN" });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const roleBadge = (role: string) => {
    if (!role) return null;
    const colors: Record<string, string> = {
      ADMIN: "border-purple-500/20 bg-purple-500/10 text-purple-300",
      TEACHER: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      INTERN: "border-pink-500/20 bg-pink-500/10 text-pink-300",
      STUDENT: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
    };
    return (
      <span
        className={`rounded-full border px-3 py-1 text-xs font-medium ${colors[role] || "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"}`}
      >
        {getChessRoleName(role)}
      </span>
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionTitle
          title="Users"
          subtitle={`${total} total user${total !== 1 ? "s" : ""} on the platform.`}
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition hover:bg-red-500 hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]"
        >
          Add New User
        </button>
      </div>

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
              {r === "ALL" ? "All Roles" : getChessRoleName(r)}
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
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[200px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px_160px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <div>ID</div>
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
                className="grid grid-cols-[200px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px_100px] gap-3 px-5 py-4"
              >
                <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
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
                className={`grid grid-cols-[200px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px_160px] gap-3 px-5 py-4 text-sm items-center ${!user.is_active ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="text-xs text-zinc-500 font-mono truncate" title={user.id}>{user.id}</div>
                <div className="truncate text-white flex items-center gap-2">
                  <Link href={`/admin/users/${user.id}`} className="hover:text-red-400 hover:underline transition">
                    {user.first_name || "—"} {user.last_name || ""}
                  </Link>
                  {!user.is_active && (
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-300">
                      INACTIVE
                    </span>
                  )}
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
                          {getChessRoleName(r)}
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
                      {(teachers || []).map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.first_name || "—"} {t.last_name || ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="truncate text-zinc-400">{user.email}</div>

                <div className="text-xs text-zinc-500">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
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
                    <>
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className={`rounded-lg border px-3 py-1 text-xs transition ${
                          user.is_active
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setDeletingId(user.id)}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </>
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

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Add New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-[0.1em] text-zinc-500 mb-1 block">First Name</label>
                  <input
                    type="text"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.1em] text-zinc-500 mb-1 block">Last Name</label>
                  <input
                    type="text"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.1em] text-zinc-500 mb-1 block">Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.1em] text-zinc-500 mb-1 block">Password *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.1em] text-zinc-500 mb-1 block">Role *</label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-red-500/50 outline-none cursor-pointer"
                >
                  <option value="STUDENT" className="bg-zinc-900">{getChessRoleName("STUDENT")}</option>
                  <option value="INTERN" className="bg-zinc-900">{getChessRoleName("INTERN")}</option>
                  <option value="TEACHER" className="bg-zinc-900">{getChessRoleName("TEACHER")}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {createLoading ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
