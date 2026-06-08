"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";
import adminService, { type AdminRole } from "@/services/admin.service";

const SYSTEM_ROLES = ["STUDENT", "TEACHER", "ADMIN"];

const ALL_PERMISSIONS = [
  "take_test",
  "view_results",
  "submit_challenge",
  "create_question",
  "edit_question",
  "delete_question",
  "create_test",
  "edit_test",
  "publish_test",
  "review_challenge",
  "manage_users",
  "manage_roles",
  "manage_questions",
  "manage_tests",
  "approve_teachers",
  "manage_challenges",
  "view_audit_logs",
  "system_health",
];

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPerms, setCreatePerms] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Expand row for details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getRoles({
        search: search || undefined,
      });
      setRoles(res.data);
      setTotal(res.total);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      await adminService.createRole({
        name: createName.toUpperCase().replace(/\s+/g, "_"),
        description: createDesc,
        permissions: createPerms,
      });
      setShowCreate(false);
      setCreateName("");
      setCreateDesc("");
      setCreatePerms([]);
      fetchRoles();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create role");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await adminService.deleteRole(id);
      setDeletingId(null);
      fetchRoles();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete role");
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePerm = (perm: string) => {
    setCreatePerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  return (
    <DashboardShell activeHref="/admin/roles" navItems={adminNavItems}>
      <SectionTitle
        title="Roles"
        subtitle={`${total} role${total !== 1 ? "s" : ""} configured.`}
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
          >
            + Add Role
          </button>
        }
      />

      {/* Search */}
      <div className="mt-6">
        <div className="relative max-w-sm">
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
            placeholder="Search roles…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Roles table */}
      <Panel className="mt-4 overflow-hidden p-0">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_120px_100px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <div>Name</div>
          <div>Description</div>
          <div>Permissions</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div className="divide-y divide-white/10">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_120px_100px] gap-3 px-5 py-4"
              >
                <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-12 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-12 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : roles.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-500">
            No roles found.
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {roles.map((role) => {
              const perms = Array.isArray(role.permissions_json)
                ? role.permissions_json
                : [];
              const isSystem = SYSTEM_ROLES.includes(role.name);

              return (
                <div key={role.id}>
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_120px_100px] gap-3 px-5 py-4 text-sm items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === role.id ? null : role.id,
                          )
                        }
                        className="text-white font-medium hover:text-red-300 transition cursor-pointer"
                      >
                        {role.name}
                      </button>
                      {isSystem && (
                        <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2 py-0.5 text-[10px] text-zinc-400">
                          system
                        </span>
                      )}
                    </div>
                    <div className="truncate text-zinc-400">
                      {role.description || "—"}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {perms.length} perm{perms.length !== 1 ? "s" : ""}
                    </div>
                    <div>
                      {isSystem ? (
                        <span className="text-xs text-zinc-600">protected</span>
                      ) : deletingId === role.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(role.id)}
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
                          onClick={() => setDeletingId(role.id)}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded permissions view */}
                  {expandedId === role.id && perms.length > 0 && (
                    <div className="border-t border-white/5 bg-white/[0.02] px-5 py-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500 mb-2">
                        Permissions
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((p) => (
                          <span
                            key={p}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Create Role Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Create New Role
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">
                  Role Name
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. MODERATOR"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">
                  Description
                </label>
                <input
                  type="text"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Role description"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-white/[0.04] transition"
                    >
                      <input
                        type="checkbox"
                        checked={createPerms.includes(perm)}
                        onChange={() => togglePerm(perm)}
                        className="accent-red-500"
                      />
                      <span className="text-xs text-zinc-300">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createLoading || !createName.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {createLoading ? "Creating…" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
