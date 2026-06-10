"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import { api } from "@/lib/api";

export default function AdminUserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}`);
      return res.data;
    },
  });

  return (
    <>
      <SectionTitle
        title={user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User Profile" : "User Profile"}
        subtitle={user ? `Detailed view for ${user.email}` : "Loading user details..."}
      />

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
            </Panel>

            {/* General Info */}
            <Panel className="p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Joined</span>
                  <span className="text-zinc-300">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Last Login</span>
                  <span className="text-zinc-300">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Phone</span>
                  <span className="text-zinc-300">{user.phone_number || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Enrolled Course</span>
                  <span className="text-zinc-300">{user.course_enrolled || "—"}</span>
                </div>
                {user.assigned_teacher && (
                  <div className="flex justify-between">
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
              <Panel className="p-6 border border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Intern Performance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/[0.03] p-4 text-center border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">Approved Questions</div>
                    <div className="text-3xl font-bold text-white">{user.approved_questions || 0}</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-4 text-center border border-white/5">
                    <div className="text-xs text-zinc-500 mb-1">Calculated Earnings</div>
                    <div className="text-3xl font-bold text-emerald-400">₹{user.calculated_earnings || 0}</div>
                  </div>
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
