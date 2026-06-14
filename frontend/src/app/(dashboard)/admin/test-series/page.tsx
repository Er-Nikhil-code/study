"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { AdminTestSeriesService } from "@/services/test-series.admin.service";
import adminService from "@/services/admin.service";
import { FileText, Edit2, X, Plus, Users as UsersIcon, Settings } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useToast } from "@/hooks/useToast";

export default function AdminTestSeriesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

  const [creatingSeries, setCreatingSeries] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    name: "", description: "",
    price: "" as number | string, discount_price: "" as number | string, status: "DRAFT" as "DRAFT" | "PUBLISHED" | "HIDDEN", launch_date: ""
  });

  const [editingSeries, setEditingSeries] = useState<any>(null);
  const [editForm, setEditForm] = useState({ 
    name: "", description: "",
    price: "" as number | string, discount_price: "" as number | string, status: "DRAFT" as "DRAFT" | "PUBLISHED" | "HIDDEN", launch_date: ""
  });

  const [managingStaffFor, setManagingStaffFor] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [saving, setSaving] = useState(false);

  const { data: testSeries = [], isLoading: loading } = useQuery({
    queryKey: ["admin_test_series"],
    queryFn: () => AdminTestSeriesService.getAdminTestSeries(),
  });

  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => adminService.getUsers({ role: "TEACHER", limit: 100 }),
    enabled: !!managingStaffFor,
  });

  const handleCreate = async () => {
    if (!createForm.name || !createForm.description) {
      toast.error("Name and description are required.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...createForm };
      payload.price = payload.price === "" ? null : Number(payload.price);
      payload.discount_price = payload.discount_price === "" ? null : Number(payload.discount_price);
      if (!payload.launch_date) {
        payload.launch_date = null;
      } else {
        payload.launch_date = new Date(payload.launch_date).toISOString();
      }

      await AdminTestSeriesService.createTestSeries(payload);
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Test series created successfully!");
      setCreatingSeries(false);
      setCreateForm({ name: "", description: "", price: "", discount_price: "", status: "DRAFT", launch_date: "" });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to create test series");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      const payload: any = { ...editForm };
      payload.price = payload.price === "" ? null : Number(payload.price);
      payload.discount_price = payload.discount_price === "" ? null : Number(payload.discount_price);
      if (!payload.launch_date) {
        payload.launch_date = null;
      } else {
        payload.launch_date = new Date(payload.launch_date).toISOString();
      }

      await AdminTestSeriesService.updateTestSeries(editingSeries.id, payload);
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Test series updated successfully!");
      setEditingSeries(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update test series");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) return;
    try {
      await AdminTestSeriesService.assignTestSeriesStaff(managingStaffFor.id, selectedStaffId);
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Staff assigned successfully!");
      
      // Update local state temporarily to reflect immediate UI change
      setManagingStaffFor({
        ...managingStaffFor,
        staff: [...(managingStaffFor.staff || []), { user_id: selectedStaffId, user: teachersData?.data.find(t => t.id === selectedStaffId) }]
      });
      setSelectedStaffId("");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to assign staff");
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    try {
      await AdminTestSeriesService.removeTestSeriesStaff(managingStaffFor.id, userId);
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Staff removed successfully!");
      
      setManagingStaffFor({
        ...managingStaffFor,
        staff: (managingStaffFor.staff || []).filter((s: any) => s.user_id !== userId)
      });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to remove staff");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Manage Test Series"
          subtitle="Create and manage test series, assign teachers, and publish to students."
        />
      </div>

      {/* CREATE MODAL */}
      {creatingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Panel className="w-full max-w-md animate-in fade-in zoom-in-95 border-red-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white">Create New Test Series</h3>
              <button onClick={() => setCreatingSeries(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Test Series Name</label>
                <input 
                  type="text" 
                  value={createForm.name} 
                  onChange={e => setCreateForm({...createForm, name: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                <textarea 
                  required
                  value={createForm.description} 
                  onChange={e => setCreateForm({...createForm, description: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50 min-h-[80px]" 
                  placeholder="Enter description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                  <select 
                    value={createForm.status} 
                    onChange={e => setCreateForm({...createForm, status: e.target.value as any})} 
                    className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Launch Date</label>
                  <input 
                    type="date" 
                    value={createForm.launch_date?.split('T')[0] || ""} 
                    onChange={e => setCreateForm({...createForm, launch_date: e.target.value})} 
                    className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Base Price (₹)</label>
                  <input 
                    type="number" min="0" 
                    value={createForm.price} 
                    onChange={e => setCreateForm({...createForm, price: e.target.value ? Number(e.target.value) : ""})} 
                    className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Discount Price (₹)</label>
                  <input 
                    type="number" min="0" 
                    value={createForm.discount_price} 
                    onChange={e => setCreateForm({...createForm, discount_price: e.target.value ? Number(e.target.value) : ""})} 
                    className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                  />
                </div>
              </div>

              <button 
                onClick={handleCreate}
                disabled={saving}
                className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50 mt-4"
              >
                {saving ? "Creating..." : "Create Test Series"}
              </button>
            </div>
          </Panel>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Panel className="w-full max-w-md animate-in fade-in zoom-in-95 border-red-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Test Series</h3>
              <button onClick={() => setEditingSeries(null)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Test Series Name</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                <textarea 
                  required
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50 min-h-[80px]" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                  <select 
                    value={editForm.status} 
                    onChange={e => setEditForm({...editForm, status: e.target.value as any})} 
                    className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Launch Date</label>
                  <input 
                    type="date" 
                    value={editForm.launch_date?.split('T')[0] || ""} 
                    onChange={e => setEditForm({...editForm, launch_date: e.target.value})} 
                    className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Base Price (₹)</label>
                  <input 
                    type="number" min="0" 
                    value={editForm.price} 
                    onChange={e => setEditForm({...editForm, price: e.target.value ? Number(e.target.value) : ""})} 
                    className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Discount Price (₹)</label>
                  <input 
                    type="number" min="0" 
                    value={editForm.discount_price} 
                    onChange={e => setEditForm({...editForm, discount_price: e.target.value ? Number(e.target.value) : ""})} 
                    className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                  />
                </div>
              </div>

              <button 
                onClick={handleEdit}
                disabled={saving}
                className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50 mt-4"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Panel>
        </div>
      )}

      {/* STAFF MODAL */}
      {managingStaffFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Panel className="w-full max-w-md animate-in fade-in zoom-in-95 border-red-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white">Manage Staff</h3>
              <button onClick={() => setManagingStaffFor(null)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <select 
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="flex-1 rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">Select a teacher...</option>
                  {teachersData?.data?.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name} ({teacher.email})
                    </option>
                  ))}
                </select>
                <button 
                  onClick={handleAssignStaff}
                  disabled={!selectedStaffId}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
                >
                  Assign
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-medium text-zinc-400 mb-3">Assigned Staff</h4>
                {managingStaffFor.staff && managingStaffFor.staff.length > 0 ? (
                  <ul className="space-y-2">
                    {managingStaffFor.staff.map((s: any) => (
                      <li key={s.user_id} className="flex items-center justify-between bg-white/5 rounded px-3 py-2 text-sm">
                        <span>{s.user?.first_name || 'Teacher'} {s.user?.last_name || ''}</span>
                        <button onClick={() => handleRemoveStaff(s.user_id)} className="text-red-400 hover:text-red-300">
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No staff assigned.</p>
                )}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-[250px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {(user?.role === "ADMIN" || user?.role === "TEACHER") && (
            <Panel 
              className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/20 hover:border-red-500/50 hover:bg-red-500/5 transition-all cursor-pointer min-h-[250px] group"
              onClick={() => setCreatingSeries(true)}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-zinc-400 group-hover:scale-110 group-hover:text-red-400 group-hover:bg-red-500/10 transition-all mb-4">
                <Plus size={32} />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">Create Test Series</h3>
              <p className="text-sm text-zinc-500 text-center mt-2 group-hover:text-zinc-400">Add a new test series bundle.</p>
            </Panel>
          )}

          {testSeries.map((series: any) => {
            const isCreatorOrAdmin = user?.role === "ADMIN" || user?.id === series.created_by || series.staff?.some((s: any) => s.user_id === user?.id);
            const canAssignStaff = user?.role === "ADMIN";
            
            return (
              <div
                key={series.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/40"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div className="absolute top-4 right-4 flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canAssignStaff && (
                    <button 
                      onClick={() => setManagingStaffFor(series)}
                      className="p-2 rounded-full bg-black/60 text-zinc-400 hover:text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                      title="Manage Staff"
                    >
                      <UsersIcon size={14} />
                    </button>
                  )}
                  {isCreatorOrAdmin && (
                    <button 
                      onClick={() => {
                        setEditingSeries(series);
                        setEditForm({ 
                          name: series.name, 
                          description: series.description || "",
                          price: series.price || "",
                          discount_price: series.discount_price || "",
                          status: series.status || "DRAFT",
                          launch_date: series.launch_date || ""
                        });
                      }}
                      className="p-2 rounded-full bg-black/60 text-zinc-400 hover:text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                      title="Edit Settings"
                    >
                      <Settings size={14} />
                    </button>
                  )}
                </div>

                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 text-red-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${series.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                    {series.status}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 tracking-wide leading-relaxed drop-shadow-sm group-hover:from-white group-hover:to-zinc-300 transition-all line-clamp-1">{series.name}</h3>
                <p className="mb-6 text-sm text-zinc-400 line-clamp-2 min-h-[40px]">
                  {series.description || "No description provided."}
                </p>

                <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-white/5 text-xs text-zinc-400 font-medium">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> Tests</span>
                    <span className="text-white bg-white/5 px-2 py-0.5 rounded">{series._count?.tests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /> Enrollments</span>
                    <span className="text-white bg-white/5 px-2 py-0.5 rounded">{series._count?.enrollments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pricing</span>
                    {series.price > 0 || series.discount_price > 0 ? (
                      <div className="flex items-center gap-2 text-emerald-400">
                        {series.discount_price > 0 ? (
                          <>
                            <span className="line-through opacity-50">₹{series.price}</span>
                            <span>₹{series.discount_price}</span>
                          </>
                        ) : (
                          <span>₹{series.price}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500">Free / Not Set</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
