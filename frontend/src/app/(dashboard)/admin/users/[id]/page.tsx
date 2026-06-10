"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import ActivityGraph from "@/components/ui/ActivityGraph";
import { api } from "@/lib/api";

export default function AdminUserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch(`/admin/users/${userId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Failed to update user");
    }
  });

  const handleEditToggle = () => {
    if (!isEditing && user) {
      setEditForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        role: user.role,
        is_active: user.is_active,
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    updateMutation.mutate(editForm);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <SectionTitle
          title={user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User Profile" : "User Profile"}
          subtitle={user ? `Detailed view for ${user.email}` : "Loading user details..."}
        />
        {user && (
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load user data. {(error as any)?.response?.data?.message}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.02]" />
          <div className="h-60 animate-pulse rounded-2xl bg-white/[0.02]" />
        </div>
      ) : user ? (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <Panel className="flex flex-col items-center p-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 text-red-500 text-3xl font-bold uppercase mb-4 overflow-hidden border-2 border-red-500/30">
                {user.profile_picture ? (
                   <img src={user.profile_picture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user.first_name?.charAt(0) || user.email?.charAt(0) || "U"
                )}
              </div>
              
              {isEditing ? (
                <div className="w-full space-y-3 mt-2 text-left">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">First Name</label>
                    <input
                      type="text"
                      value={editForm.first_name}
                      onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Last Name</label>
                    <input
                      type="text"
                      value={editForm.last_name}
                      onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Role</label>
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/50"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="INTERN">INTERN</option>
                      <option value="TEACHER">TEACHER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editForm.is_active}
                      onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="rounded border-white/10 bg-zinc-900 accent-red-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-zinc-300">Account is Active</label>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "No Name"}
                  </h2>
                  <div className="text-sm text-zinc-400 mb-4">{user.email}</div>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                      {user.role}
                    </span>
                    {user.custom_role && (
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                        {user.custom_role.name}
                      </span>
                    )}
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${user.is_active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </>
              )}
            </Panel>

            {/* General Info */}
            <Panel className="p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Information</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Joined</span>
                  <span className="text-zinc-300">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Last Login</span>
                  <span className="text-zinc-300">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}</span>
                </div>
                
                <div className={`flex ${isEditing ? 'flex-col items-start gap-1' : 'justify-between items-center'}`}>
                  <span className="text-zinc-500">Phone</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.phone_number}
                      onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
                      placeholder="e.g. +1 234 567 8900"
                      className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/50"
                    />
                  ) : (
                    <span className="text-zinc-300">{user.phone_number || "—"}</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Enrolled Course</span>
                  <span className="text-zinc-300">{user.course_enrolled || "—"}</span>
                </div>
                {user.assigned_teacher && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Teacher</span>
                    <span className="text-zinc-300">
                      {user.assigned_teacher.first_name} {user.assigned_teacher.last_name}
                    </span>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Stats & Specifics */}
          <div className="md:col-span-2 space-y-6">
            {user.role === "INTERN" && (
              <>
                <Panel className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 border-b border-emerald-500/10 pb-2">Intern Contributions</h3>
                  
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white/[0.03] p-4 text-center border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">Approved Questions</div>
                      <div className="text-3xl font-bold text-white">{user.approved_questions || 0}</div>
                    </div>
                    <div className="rounded-xl bg-white/[0.03] p-4 text-center border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">Calculated Earnings</div>
                      <div className="text-3xl font-bold text-emerald-400">₹{user.calculated_earnings || 0}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">365-Day Activity Graph</h4>
                    <ActivityGraph data={user.activity_graph || []} userName={`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email} />
                  </div>
                </Panel>
              </>
            )}

            {user.role === "TEACHER" && (() => {
              const map = new Map<string, { blueCount: number; emeraldCount: number }>();
              (user.tests_created_graph || []).forEach((d: any) => {
                map.set(d.date, { blueCount: d.count, emeraldCount: 0 });
              });
              (user.questions_approved_graph || []).forEach((d: any) => {
                const existing = map.get(d.date) || { blueCount: 0, emeraldCount: 0 };
                existing.emeraldCount = d.count;
                map.set(d.date, existing);
              });
              const mixedData = Array.from(map.entries()).map(([date, counts]) => ({
                date,
                ...counts
              }));

              return (
                <Panel className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Teacher Contributions</h3>
                  <div>
                    <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">365-Day Activity Graph</h4>
                    <ActivityGraph mixedData={mixedData} theme="mixed" userName={`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email} />
                  </div>
                </Panel>
              );
            })()}

            {user.role === "STUDENT" && (
              <Panel className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 border-b border-emerald-500/10 pb-2">Student Activity</h3>
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Test Attempts (Last 365 Days)</h4>
                  <ActivityGraph data={user.activity_graph || []} theme="emerald" userName={`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email} />
                </div>
              </Panel>
            )}

            {user.user_stats && (
              <Panel className="p-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Platform Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-500">Total Tests</div>
                    <div className="text-xl font-medium text-white">{user.user_stats.total_tests}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-500">Total Score</div>
                    <div className="text-xl font-medium text-white">{user.user_stats.total_score}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-500">Current Streak</div>
                    <div className="text-xl font-medium text-orange-400">{user.user_stats.current_streak} 🔥</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-500">Avg Accuracy</div>
                    <div className="text-xl font-medium text-emerald-400">
                      {user.user_stats.avg_accuracy !== null ? `${user.user_stats.avg_accuracy.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {!user.user_stats && user.role !== "INTERN" && (
              <Panel className="p-6 text-center text-zinc-500">
                No activity statistics available for this user yet.
              </Panel>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
