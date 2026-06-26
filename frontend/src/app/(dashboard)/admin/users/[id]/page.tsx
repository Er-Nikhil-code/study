"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import dynamic from "next/dynamic";
const ActivityGraph = dynamic(() => import("@/components/ui/ActivityGraph"), { ssr: false });
import { api } from "@/lib/api";
import adminService from "@/services/admin.service";
import { HierarchyService } from "@/services/hierarchy.service";
import { getChessRoleName } from "@/lib/role";
import { format } from "date-fns";

export default function AdminUserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: rolesData } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const res = await adminService.getRoles({ limit: 100 });
      return res.data;
    },
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}`);
      return res.data;
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["courses", "hierarchy"],
    queryFn: () => HierarchyService.getFullHierarchy(),
  });

  const { data: testSeries = [] } = useQuery({
    queryKey: ["testSeries", "hierarchy"],
    queryFn: () => HierarchyService.getTestSeriesHierarchy(),
  });

  const { data: knights } = useQuery({
    queryKey: ["knights"],
    queryFn: () => adminService.getUsers({ role: "TEACHER", limit: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await adminService.updateUser(userId, data);
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
        custom_role_id: user.custom_role_id || "",
        course_enrolled: user.course_enrolled || "",
        assigned_teacher_id: user.assigned_teacher_id || "",
        pending_remove_courses: [] as string[],
        pending_add_courses: [] as string[],
        pending_remove_ts: [] as string[],
        pending_add_ts: [] as string[],
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    const payload = { ...editForm };
    if (payload.course_enrolled === "") payload.course_enrolled = null;
    if (payload.custom_role_id === "") payload.custom_role_id = null;
    if (payload.assigned_teacher_id === "") payload.assigned_teacher_id = null;
    // Include buffered enrollment changes
    if (payload.pending_remove_courses?.length) payload.remove_enrollment = payload.pending_remove_courses;
    if (payload.pending_add_courses?.length) payload.add_enrollment = payload.pending_add_courses;
    if (payload.pending_remove_ts?.length) payload.remove_ts_enrollment = payload.pending_remove_ts;
    if (payload.pending_add_ts?.length) payload.add_ts_enrollment = payload.pending_add_ts;
    // Clean up internal fields
    delete payload.pending_remove_courses;
    delete payload.pending_add_courses;
    delete payload.pending_remove_ts;
    delete payload.pending_add_ts;
    updateMutation.mutate(payload);
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
          <div className="h-40 hidden rounded-2xl bg-white/[0.02]" />
          <div className="h-60 hidden rounded-2xl bg-white/[0.02]" />
        </div>
      ) : user ? (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <Panel className="flex flex-col items-center p-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 text-red-500 text-3xl font-bold uppercase mb-4 overflow-hidden border-2 border-red-500/30">
                {user.profile_picture ? (
                   <Image src={user.profile_picture} alt="Profile" width={96} height={96} className="h-full w-full object-cover" />
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
                      <option value="STUDENT">WARRIOR</option>
                      <option value="INTERN">PAWN</option>
                      <option value="TEACHER">KNIGHT</option>
                      <option value="ADMIN">KING</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Custom Role</label>
                    <select
                      value={editForm.custom_role_id || ""}
                      onChange={e => setEditForm({ ...editForm, custom_role_id: e.target.value || null })}
                      className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/50"
                    >
                      <option value="">No Custom Role</option>
                      {(rolesData || []).map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  {editForm.role === "INTERN" && (
                    <div>
                      <label className="text-xs text-zinc-500 mb-1 block">Assigned Knight</label>
                      <select
                        value={editForm.assigned_teacher_id || ""}
                        onChange={e => setEditForm({ ...editForm, assigned_teacher_id: e.target.value || null })}
                        className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm text-white outline-none focus:border-red-500/50"
                      >
                        <option value="">None</option>
                        {knights?.data?.map((k: any) => (
                          <option key={k.id} value={k.id}>{k.first_name} {k.last_name} ({k.email})</option>
                        ))}
                      </select>
                    </div>
                  )}
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
                      {getChessRoleName(user.role)}
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

                {user.role === "STUDENT" && (
                  <div className="flex flex-col items-start gap-2 w-full pt-2">
                    <span className="text-zinc-500">Enrolled Courses</span>
                    {isEditing ? (
                      <div className="flex flex-col w-full gap-2">
                        {user.course_enrollments
                          ?.filter((enr: any) => !(editForm.pending_remove_courses || []).includes(enr.course_id))
                          .map((enr: any) => (
                          <div key={enr.course_id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded px-3 py-1.5 w-full">
                            <span className="text-sm text-zinc-300">{enr.course?.name || enr.course_id}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm((prev: any) => ({
                                  ...prev,
                                  pending_remove_courses: [...(prev.pending_remove_courses || []), enr.course_id],
                                }));
                              }}
                              className="text-xs text-red-400 hover:text-red-300 p-1"
                            >
                              Unenroll
                            </button>
                          </div>
                        ))}
                        {(editForm.pending_add_courses || []).map((courseId: string) => {
                          const course = courses.find((c: any) => c.id === courseId);
                          return (
                            <div key={courseId} className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-1.5 w-full">
                              <span className="text-sm text-emerald-300">{course?.name || courseId} <span className="text-xs text-emerald-400/60">(pending)</span></span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditForm((prev: any) => ({
                                    ...prev,
                                    pending_add_courses: (prev.pending_add_courses || []).filter((id: string) => id !== courseId),
                                  }));
                                }}
                                className="text-xs text-zinc-400 hover:text-zinc-300 p-1"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                        {(editForm.pending_remove_courses || []).length > 0 && (
                          <p className="text-xs text-amber-400/80 mt-1">⚠ {editForm.pending_remove_courses.length} course(s) will be unenrolled on save</p>
                        )}
                        <div className="flex w-full items-center gap-2 mt-2">
                          <select
                            value=""
                            onChange={e => {
                                if (e.target.value) {
                                  setEditForm((prev: any) => ({
                                    ...prev,
                                    pending_add_courses: [...(prev.pending_add_courses || []), e.target.value],
                                  }));
                                }
                            }}
                            className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm text-zinc-400 outline-none focus:border-red-500/50"
                          >
                            <option value="">+ Enroll in new course...</option>
                            {courses
                              .filter((c: any) => 
                                !user.course_enrollments?.some((enr: any) => enr.course_id === c.id) &&
                                !(editForm.pending_add_courses || []).includes(c.id)
                              )
                              .map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 w-full">
                        {user.course_enrollments?.length > 0 ? (
                          user.course_enrollments.map((enr: any) => (
                            <span key={enr.course_id} className="text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20 rounded-full px-3 py-1">
                              {enr.course?.name || enr.course_id}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-sm">— No courses enrolled —</span>
                        )}
                      </div>
                    )}
                    <span className="text-zinc-500 mt-2">Enrolled Test Series</span>
                    {isEditing ? (
                      <div className="flex flex-col w-full gap-2">
                        {user.test_series_enrollments
                          ?.filter((enr: any) => !(editForm.pending_remove_ts || []).includes(enr.test_series_id))
                          .map((enr: any) => (
                          <div key={enr.test_series_id} className="flex justify-between items-center bg-white/5 border border-white/10 rounded px-3 py-1.5 w-full">
                            <span className="text-sm text-zinc-300">{enr.test_series?.name || enr.test_series_id}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm((prev: any) => ({
                                  ...prev,
                                  pending_remove_ts: [...(prev.pending_remove_ts || []), enr.test_series_id],
                                }));
                              }}
                              className="text-xs text-red-400 hover:text-red-300 p-1"
                            >
                              Unenroll
                            </button>
                          </div>
                        ))}
                        {(editForm.pending_add_ts || []).map((tsId: string) => {
                          const ts = testSeries.find((t: any) => t.id === tsId);
                          return (
                            <div key={tsId} className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-1.5 w-full">
                              <span className="text-sm text-emerald-300">{ts?.name || tsId} <span className="text-xs text-emerald-400/60">(pending)</span></span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditForm((prev: any) => ({
                                    ...prev,
                                    pending_add_ts: (prev.pending_add_ts || []).filter((id: string) => id !== tsId),
                                  }));
                                }}
                                className="text-xs text-zinc-400 hover:text-zinc-300 p-1"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                        {(editForm.pending_remove_ts || []).length > 0 && (
                          <p className="text-xs text-amber-400/80 mt-1">⚠ {editForm.pending_remove_ts.length} test series will be unenrolled on save</p>
                        )}
                        <div className="flex w-full items-center gap-2 mt-2">
                          <select
                            value=""
                            onChange={e => {
                                if (e.target.value) {
                                  setEditForm((prev: any) => ({
                                    ...prev,
                                    pending_add_ts: [...(prev.pending_add_ts || []), e.target.value],
                                  }));
                                }
                            }}
                            className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-1.5 text-sm text-zinc-400 outline-none focus:border-red-500/50"
                          >
                            <option value="">+ Enroll in new test series...</option>
                            {testSeries
                              .filter((ts: any) => 
                                !user.test_series_enrollments?.some((enr: any) => enr.test_series_id === ts.id) &&
                                !(editForm.pending_add_ts || []).includes(ts.id)
                              )
                              .map((ts: any) => (
                              <option key={ts.id} value={ts.id}>{ts.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 w-full">
                        {user.test_series_enrollments?.length > 0 ? (
                          user.test_series_enrollments.map((enr: any) => (
                            <span key={enr.test_series_id} className="text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20 rounded-full px-3 py-1">
                              {enr.test_series?.name || enr.test_series_id}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-sm">— No test series enrolled —</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {user.assigned_teacher && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Knight</span>
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
                  <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 border-b border-emerald-500/10 pb-2">Pawn Contributions</h3>
                  
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
                    <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">6-Month Activity Graph</h4>
                    <ActivityGraph data={user.activity_graph || []} userName={`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email} />
                  </div>

                  {user.contributing_courses && user.contributing_courses.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider border-b border-emerald-500/10 pb-2">Contributing Courses</h4>
                      <div className="grid gap-3 sm:grid-cols-2 mt-3">
                        {user.contributing_courses.map((course: any) => (
                          <div key={course.id} className="p-4 bg-black/40 border border-emerald-500/20 rounded-xl">
                            <h5 className="text-sm font-semibold text-white mb-2">{course.name}</h5>
                            {course.sections?.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {course.sections.map((sec: any) => (
                                  <span key={sec.id} className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    {sec.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-500 italic">No assigned sections in this course</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Panel>
              </>
            )}

            {user.role === "TEACHER" && (
              <Panel className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Knight Contributions</h3>
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">6-Month Activity Graph</h4>
                  <ActivityGraph data={user.activity_graph || []} userName={`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email} />
                </div>

                {user.assigned_courses && user.assigned_courses.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider border-b border-white/10 pb-2">Assigned Courses & Sections</h4>
                    <div className="grid gap-3 sm:grid-cols-2 mt-3">
                      {user.assigned_courses.map((course: any) => (
                        <div key={course.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="text-sm font-semibold text-white">{course.name}</h5>
                            {course.created_by === user.id && (
                              <span className="text-[9px] uppercase tracking-wider bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">Creator</span>
                            )}
                          </div>
                          {course.sections?.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {course.sections.map((sec: any) => (
                                <span key={sec.id} className="text-[10px] px-2 py-1 rounded-md bg-white/10 text-zinc-300 border border-white/20">
                                  {sec.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic mt-2 block">General Staff / No specific sections managed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user.pawns_details && user.pawns_details.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider border-b border-white/10 pb-2">Assigned Pawns (Interns)</h4>
                    <div className="flex flex-col gap-3 mt-3">
                      {user.pawns_details.map((intern: any) => (
                        <div key={intern.id} className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 p-4 bg-black/40 border border-white/10 rounded-xl">
                          {/* Profile Column */}
                          <div className="flex flex-col items-center gap-2 w-32 shrink-0">
                            <div className="h-14 w-14 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
                              {intern.profile_picture ? (
                                <Image src={intern.profile_picture} alt="Intern" width={56} height={56} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-zinc-500 font-bold text-xl">
                                  {intern.first_name?.charAt(0) || "U"}
                                </div>
                              )}
                            </div>
                            <div className="text-center">
                              <h5 className="text-sm font-semibold text-white truncate w-32 px-2" title={`${intern.first_name} ${intern.last_name}`}>
                                {intern.first_name} {intern.last_name}
                              </h5>
                              <p className="text-[10px] text-zinc-400 truncate w-32 px-2" title={intern.email}>{intern.email}</p>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="hidden sm:block w-px bg-white/10" />

                          {/* Stats Column */}
                          <div className="flex-1 flex flex-col justify-between min-w-0 py-1 w-full">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Questions</div>
                                <div className="text-sm font-bold text-emerald-400">{intern.questions_submitted || 0}</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Notes</div>
                                <div className="text-sm font-bold text-amber-400">{intern.notes_created || 0}</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Approval %</div>
                                <div className="text-sm font-bold text-white">{intern.approval_percentage}%</div>
                              </div>
                              <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5 flex flex-col justify-center">
                                <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Last Login</div>
                                <div className="text-[10px] font-medium text-zinc-300">
                                  {intern.last_login_at ? format(new Date(intern.last_login_at), "MMM d, yyyy") : "Never"}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Joined:</span>
                                <span className="text-xs text-zinc-300">{format(new Date(intern.created_at), "MMM d, yyyy")}</span>
                              </div>
                              <div className="flex flex-col sm:items-end">
                                <span className="text-[9px] text-zinc-500 mb-1 uppercase tracking-wider">10-Day Activity Heatmap</span>
                                <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1.5 rounded-lg border border-white/5">
                                  <span className="text-[9px] text-zinc-600">Old</span>
                                  <div className="flex gap-1">
                                    {intern.heatmap?.map((day: any, i: number) => {
                                      let bg = "bg-zinc-800";
                                      if (day.count > 0 && day.count <= 2) bg = "bg-emerald-900/60";
                                      else if (day.count > 2 && day.count <= 5) bg = "bg-emerald-700/80";
                                      else if (day.count > 5 && day.count <= 10) bg = "bg-emerald-500";
                                      else if (day.count > 10) bg = "bg-emerald-400";
                                      return (
                                        <div key={i} className={`w-3.5 h-3.5 rounded-[2px] ${bg} transition-colors hover:ring-1 hover:ring-white/50`} title={`${day.date}: ${day.count} activities`} />
                                      );
                                    })}
                                  </div>
                                  <span className="text-[9px] text-zinc-600">New</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {user.role === "STUDENT" && (
              <Panel className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 border-b border-emerald-500/10 pb-2">Warrior Activity</h3>
                <div>
                  <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Test Attempts (Last 6 Months)</h4>
                  <ActivityGraph data={user.activity_graph || []} userName={`${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email} />
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
