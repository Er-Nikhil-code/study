const fs = require('fs');
const path = '/Volumes/NIKHIL/Study/frontend/src/app/(dashboard)/admin/users/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add PERMISSION_GROUPS
const permGroups = `
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
`;
content = content.replace('const PAGE_SIZE = 15;', 'const PAGE_SIZE = 15;\n' + permGroups);

// 2. Add Role Fetching & Modal States
const states = `
  const { data: rolesData } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const res = await adminService.getRoles({});
      return res.data;
    },
  });
  const roles = Array.isArray(rolesData) ? rolesData : Array.isArray((rolesData as any)?.data) ? (rolesData as any).data : [];

  // Add Custom Role Modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formLevel, setFormLevel] = useState(0);
  const [formParentId, setFormParentId] = useState("");
  const [formPerms, setFormPerms] = useState<string[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  // Assign Role Modal
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

  const togglePerm = (perm: string) => {
    setFormPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleSaveRole = async () => {
    if (!formName.trim()) return;
    setFormLoading(true);
    try {
      const data = {
        name: formName.toUpperCase().replace(/\\s+/g, "_"),
        description: formDesc,
        designation: formDesignation,
        level: formLevel,
        parent_id: formParentId || null,
        permissions: formPerms,
      };
      await adminService.createRole(data);
      setShowRoleModal(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      alert("Role created successfully!");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create role");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignRoleModal = async () => {
    if (!assignUserId.trim()) return;
    setAssignLoading(true);
    try {
      await adminService.assignRole(assignUserId, assignRoleName);
      alert("Role assigned successfully!");
      setShowAssign(false);
      setAssignUserId("");
      setUserSearchTerm("");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign role");
    } finally {
      setAssignLoading(false);
    }
  };
`;
content = content.replace('const [search, setSearch] = useState("");\n  const [roleFilter, setRoleFilter] = useState("ALL");', 'const [search, setSearch] = useState("");\n  const [roleFilter, setRoleFilter] = useState("ALL");\n' + states);

// 3. Update top buttons
const buttons = `
        <div className="flex gap-2">
          <button
            onClick={() => setShowAssign(true)}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.04]"
          >
            Assign Role
          </button>
          <button
            onClick={() => setShowRoleModal(true)}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.04]"
          >
            Add Role
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition hover:bg-red-500 hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]"
          >
            Add New User
          </button>
        </div>
`;
content = content.replace(
  /<button\s*onClick=\{\(\) => setShowAddModal\(true\)\}\s*className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-\[0_0_15px_rgba\(220,38,38,0\.5\)\] transition hover:bg-red-500 hover:shadow-\[0_0_25px_rgba\(220,38,38,0\.6\)\]"\s*>\s*Add New User\s*<\/button>/,
  buttons
);

// 4. Update the select inside table to map from 'roles' (including custom roles)
content = content.replace(
  /\{ASSIGNABLE_ROLES\.map\(\(r\) => \(\s*<option key=\{r\} value=\{r\}>\s*\{getChessRoleName\(r\)\}\s*<\/option>\s*\)\)\}/,
  `{(roles.length > 0 ? roles.map((r: any) => r.name) : ASSIGNABLE_ROLES).map((r: string) => (
                        <option key={r} value={r}>
                          {getChessRoleName(r)}
                        </option>
                      ))}`
);

// 5. Add Modals at the bottom
const modals = `

      {/* ═══ Add Custom Role Modal ═══ */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6">Create Custom Role</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">Role Name (Code) *</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. SENIOR_TEACHER"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">Designation</label>
                  <input type="text" value={formDesignation} onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Content Head"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">Description</label>
                <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="What does this role do?"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">Reports To (Parent)</label>
                  <select value={formParentId} onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none focus:border-red-500/50 appearance-none cursor-pointer">
                    <option value="" className="bg-zinc-900">— None (Top level)</option>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id} className="bg-zinc-900">
                        {getChessRoleName(r.name)} {r.designation ? \`(\${r.designation})\` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">Hierarchy Level</label>
                  <input type="number" value={formLevel} onChange={(e) => setFormLevel(parseInt(e.target.value, 10))}
                    min={0} max={10}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none focus:border-red-500/50" />
                  <p className="text-[10px] text-zinc-600 mt-1">0 = top, higher = lower</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Permissions</label>
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

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setShowRoleModal(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white">Cancel</button>
              <button onClick={handleSaveRole} disabled={formLoading || !formName.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                {formLoading ? "Creating…" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Assign Role Modal ═══ */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6">Assign Role to User</h3>
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">User ID or Name</label>
                <input type="text" value={userSearchTerm || assignUserId} onChange={(e) => {
                  setUserSearchTerm(e.target.value);
                  setAssignUserId("");
                }}
                  placeholder="Type name or paste ID..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/50" />
                
                {isSearchingUsers && (
                  <div className="absolute right-3 top-9 text-xs text-zinc-500">
                    ...
                  </div>
                )}
                
                {!assignUserId && searchedUsers.length > 0 && (
                  <div className="absolute top-[105%] left-0 right-0 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                    {searchedUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setAssignUserId(u.id);
                          setUserSearchTerm(\`\${u.first_name} \${u.last_name} (\${u.email})\`.trim() || u.email);
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
                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">Role</label>
                <select value={assignRoleName} onChange={(e) => setAssignRoleName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none focus:border-red-500/50 appearance-none cursor-pointer">
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.name} className="bg-zinc-900">
                      {getChessRoleName(r.name)} {r.designation ? \`(\${r.designation})\` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setShowAssign(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-white">Cancel</button>
              <button onClick={handleAssignRoleModal} disabled={assignLoading || !assignUserId.trim()}
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
`;
content = content.replace(/\s*<\/>\s*\);\s*\}\s*$/, modals);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated users/page.tsx');
