"use client";

import { useEffect, useState, useCallback } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { adminNavItems } from "../nav";
import adminService, { type AdminRole } from "@/services/admin.service";
import { getChessRoleName } from "@/lib/role";

const SYSTEM_ROLES = ["STUDENT", "INTERN", "TEACHER", "ADMIN"];

// Grouped for better UI
const PERMISSION_GROUPS = {
  "AI Features": ["use_ai_generator", "chat_with_ai"],
  "Content & Hierarchy": ["manage_hierarchy", "create_notes", "review_notes"],
  "Questions": ["create_question", "edit_question", "edit_own_question", "delete_question", "approve_question", "manage_questions"],
  "Tests": ["create_test", "edit_test", "publish_test", "manage_tests"],
  "Challenges": ["submit_challenge", "review_challenge", "manage_challenges"],
  "User Management": ["manage_users", "manage_roles", "approve_teachers"],
  "System": ["view_audit_logs", "system_health"],
  "Warrior Specific": ["take_test", "view_results"]
};

const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat();

type RoleNode = AdminRole & {
  designation?: string | null;
  level?: number;
  parent?: { id: string; name: string; designation?: string } | null;
  children?: RoleNode[];
  user_count?: number;
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleNode[]>([]);
  const [hierarchy, setHierarchy] = useState<RoleNode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "tree">("tree");

  // Search
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<RoleNode | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formLevel, setFormLevel] = useState(0);
  const [formParentId, setFormParentId] = useState("");
  const [formPerms, setFormPerms] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Assign role modal
  // Assign role modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoleName, setAssignRoleName] = useState("STUDENT");
  const [assignLoading, setAssignLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (!userSearchTerm || assignUserId) {
      setSearchedUsers([]);
      return;
    }
    const t = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await adminService.getUsers({ search: userSearchTerm, limit: 5 } as any);
        setSearchedUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [userSearchTerm, assignUserId]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, hierarchyRes] = await Promise.all([
        adminService.getRoles({ search: search || undefined }),
        adminService.getRoleHierarchy().catch(() => []),
      ]);
      setRoles(rolesRes.data.filter((r: any) => !SYSTEM_ROLES.includes(r.name)));
      setTotal(rolesRes.total); // Note: total might be slightly off if backend doesn't filter, but it's acceptable for UI
      setHierarchy((hierarchyRes as any).filter((r: any) => !SYSTEM_ROLES.includes(r.name)));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openCreate = () => {
    setEditRole(null);
    setFormName(""); setFormDesc(""); setFormDesignation(""); setFormLevel(0);
    setFormParentId(""); setFormPerms([]);
    setShowModal(true);
  };

  const openEdit = (role: RoleNode) => {
    setEditRole(role);
    setFormName(role.name);
    setFormDesc(role.description || "");
    setFormDesignation((role as any).designation || "");
    setFormLevel((role as any).level ?? 0);
    setFormParentId(role.parent?.id || "");
    setFormPerms(Array.isArray(role.permissions_json) ? role.permissions_json : []);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setFormLoading(true);
    try {
      const data = {
        name: formName.toUpperCase().replace(/\s+/g, "_"),
        description: formDesc,
        designation: formDesignation,
        level: formLevel,
        parent_id: formParentId || null,
        permissions: formPerms,
      };
      if (editRole) {
        await adminService.updateRole(editRole.id, data);
      } else {
        await adminService.createRole(data);
      }
      setShowModal(false);
      fetchRoles();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save role");
    } finally {
      setFormLoading(false);
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

  const handleAssign = async () => {
    if (!assignUserId.trim()) return;
    setAssignLoading(true);
    try {
      await adminService.assignRole(assignUserId, assignRoleName);
      alert("Role assigned successfully!");
      setShowAssign(false);
      setAssignUserId("");
      setUserSearchTerm("");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign role");
    } finally {
      setAssignLoading(false);
    }
  };

  const togglePerm = (perm: string) => {
    setFormPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  /* ─── Render hierarchy tree recursively ─── */
  const renderTreeNode = (node: RoleNode, depth: number = 0): React.ReactNode => (
    <div key={node.id} style={{ paddingLeft: depth * 28 }}>
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-white/[0.04] ${depth === 0 ? "bg-white/[0.02]" : ""}`}>
        {/* Connector lines */}
        {depth > 0 && (
          <span className="text-zinc-600">└─</span>
        )}

        {/* Role info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{getChessRoleName(node.name)}</span>
            {(node as any).designation && (
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-400">
                {(node as any).designation}
              </span>
            )}
            {SYSTEM_ROLES.includes(node.name) && (
              <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2 py-0.5 text-[10px] text-zinc-500">system</span>
            )}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{node.description || "—"}</div>
        </div>

        {/* Level */}
        <div className="text-xs text-zinc-500 w-14 text-center">
          L{(node as any).level ?? 0}
        </div>

        {/* User count */}
        <div className="text-xs text-zinc-400 w-16 text-center">
          {(node as any).user_count ?? 0} users
        </div>

        {/* Permissions count */}
        <div className="text-xs text-zinc-500 w-16 text-center">
          {(Array.isArray(node.permissions_json) ? node.permissions_json.length : 0)} perms
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <button onClick={() => openEdit(node)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-zinc-400 transition hover:text-white">
            Edit
          </button>
          {!SYSTEM_ROLES.includes(node.name) && (
            deletingId === node.id ? (
              <div className="flex gap-1">
                <button onClick={() => handleDelete(node.id)} disabled={deleteLoading}
                  className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50">{deleteLoading ? "…" : "Yes"}</button>
                <button onClick={() => setDeletingId(null)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400">No</button>
              </div>
            ) : (
              <button onClick={() => setDeletingId(node.id)}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/20">Del</button>
            )
          )}
        </div>
      </div>
      {/* Render children */}
      {node.children && node.children.length > 0 && (
        <div className="border-l border-white/5 ml-4">
          {node.children.map((child: RoleNode) => renderTreeNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <SectionTitle
        title="Roles & Hierarchy"
        subtitle={`${total} role${total !== 1 ? "s" : ""} configured with hierarchy.`}
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowAssign(true)}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:text-white">
              Assign Role
            </button>
            <button onClick={openCreate}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20">
              + Add Role
            </button>
          </div>
        }
      />

      {/* View toggle + Search */}
      <div className="mt-6 flex items-center gap-4">
        <div className="flex rounded-xl border border-white/10 overflow-hidden">
          <button onClick={() => setView("tree")}
            className={`px-3 py-1.5 text-xs transition ${view === "tree" ? "bg-red-500/15 text-red-200" : "bg-white/[0.03] text-zinc-400 hover:text-white"}`}>
            🌳 Tree
          </button>
          <button onClick={() => setView("list")}
            className={`px-3 py-1.5 text-xs transition ${view === "list" ? "bg-red-500/15 text-red-200" : "bg-white/[0.03] text-zinc-400 hover:text-white"}`}>
            📋 List
          </button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search roles…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-red-500/30" />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Tree View */}
      {view === "tree" && (
        <Panel className="mt-4 p-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 hidden rounded-xl bg-white/[0.03]" style={{ marginLeft: i * 28 }} />
              ))}
            </div>
          ) : hierarchy.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-500">
              No hierarchy configured.
              <button onClick={async () => { 
                try {
                  await adminService.seedRoles(); 
                  await fetchRoles(); 
                } catch(e: any) {
                  alert(e.response?.data?.message || e.message);
                }
              }}
                className="ml-2 text-red-400 hover:text-red-300 underline">Seed default roles</button>
            </div>
          ) : (
            <div className="space-y-1">{hierarchy.map((node: RoleNode) => renderTreeNode(node, 0))}</div>
          )}
        </Panel>
      )}

      {/* List View */}
      {view === "list" && (
        <Panel className="mt-6 p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1.5fr)_80px_80px_100px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.2em] text-zinc-500 text-center">
              <div>Name</div><div>Designation</div><div>Reports To</div><div>Level</div><div>Perms</div><div>Actions</div>
            </div>
            {loading ? (
              <div className="divide-y divide-white/10">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1.5fr)_80px_80px_100px] gap-3 px-5 py-4">
                    {[...Array(6)].map((__, j) => (
                      <div key={j} className="h-4 w-16 hidden rounded bg-white/10" />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {roles.map((role) => {
                  const perms = Array.isArray(role.permissions_json) ? role.permissions_json : [];
                  const isSystem = SYSTEM_ROLES.includes(role.name);
                  return (
                    <div key={role.id} className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1.5fr)_80px_80px_100px] gap-3 px-5 py-4 text-sm items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{getChessRoleName(role.name)}</span>
                        {isSystem && <span className="rounded-full border border-zinc-600/30 bg-zinc-600/10 px-2 py-0.5 text-[10px] text-zinc-400">system</span>}
                      </div>
                      <div className="text-xs text-zinc-400">{(role as any).designation || "—"}</div>
                      <div className="text-xs text-zinc-500">{role.parent?.name || "— (top level)"}</div>
                      <div className="text-xs text-zinc-500">L{(role as any).level ?? 0}</div>
                      <div className="text-xs text-zinc-500">{perms.length}</div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(role)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:text-white">Edit</button>
                        {!isSystem && (
                          <button onClick={() => setDeletingId(role.id)}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300">Del</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* ═══ Create / Edit Role Modal ═══ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editRole ? `Edit: ${editRole.name}` : "Create New Role"}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">Role Name</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. CONTENT_HEAD"
                    disabled={!!editRole && SYSTEM_ROLES.includes(editRole.name)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/30 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">Designation</label>
                  <input type="text" value={formDesignation} onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Content Head"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/30" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">Description</label>
                <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What does this role do?"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/30" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">Reports To (Parent)</label>
                  <select value={formParentId} onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none focus:border-red-500/30 appearance-none cursor-pointer">
                    <option value="" className="bg-zinc-900">— None (Top level)</option>
                    {roles.filter((r) => r.id !== editRole?.id).map((r) => (
                      <option key={r.id} value={r.id} className="bg-zinc-900">
                        {getChessRoleName(r.name)} {(r as any).designation ? `(${(r as any).designation})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">Hierarchy Level</label>
                  <input type="number" value={formLevel} onChange={(e) => setFormLevel(parseInt(e.target.value, 10))}
                    min={0} max={10}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none focus:border-red-500/30" />
                  <p className="text-[10px] text-zinc-600 mt-1">0 = top, higher = lower</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2 uppercase tracking-wide">Permissions</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  {Object.entries(PERMISSION_GROUPS).map(([groupName, perms]) => (
                    <div key={groupName} className="space-y-2">
                      <div className="text-xs font-bold text-red-400 mb-1 border-b border-white/10 pb-1">{groupName}</div>
                      {perms.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-white/[0.04] transition">
                          <input type="checkbox" checked={formPerms.includes(perm)} onChange={() => togglePerm(perm)} className="accent-red-500" />
                          <span className="text-xs text-zinc-300">{perm.replace(/_/g, " ")}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={formLoading || !formName.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                {formLoading ? "Saving…" : editRole ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Assign Role Modal ═══ */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Assign Role to User</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">User ID or Name</label>
                <input type="text" value={userSearchTerm || assignUserId} onChange={(e) => {
                  setUserSearchTerm(e.target.value);
                  setAssignUserId("");
                }}
                  placeholder="Type name or paste ID..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/30" />
                
                {isSearchingUsers && (
                  <div className="absolute right-3 top-9">
                    null
                  </div>
                )}
                
                {!assignUserId && searchedUsers.length > 0 && (
                  <div className="absolute top-[105%] left-0 right-0 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                    {searchedUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setAssignUserId(u.id);
                          setUserSearchTerm(`${u.first_name} ${u.last_name} (${u.email})`.trim() || u.email);
                          setSearchedUsers([]);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                      >
                        <div className="font-medium text-white">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-zinc-500">{u.email} • ID: {u.id}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wide">Role</label>
                <select value={assignRoleName} onChange={(e) => setAssignRoleName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none focus:border-red-500/30 appearance-none cursor-pointer">
                  {roles.map((r) => (
                    <option key={r.id} value={r.name} className="bg-zinc-900">
                      {getChessRoleName(r.name)} {r.designation ? `(${r.designation})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAssign(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white">Cancel</button>
              <button onClick={handleAssign} disabled={assignLoading || !assignUserId.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                {assignLoading ? "Assigning…" : "Assign Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
