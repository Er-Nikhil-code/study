"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import { AdminTestSeriesService } from "@/services/test-series.admin.service";
import Link from "next/link";
import { BookOpen, Edit2, X, ShoppingCart, Plus } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { CartService } from "@/services/cart.service";

export default function TestSeriesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [creatingSeries, setCreatingSeries] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    name: "", code: "", description: "",
    price: "" as number | string, discount_price: "" as number | string, status: "DRAFT" as "DRAFT" | "PUBLISHED" | "HIDDEN", launch_date: ""
  });

  const [editingSeries, setEditingSeries] = useState<any>(null);
  const [editForm, setEditForm] = useState({ 
    name: "", code: "", description: "",
    price: "" as number | string, discount_price: "" as number | string, status: "DRAFT" as "DRAFT" | "PUBLISHED" | "HIDDEN", launch_date: ""
  });
  const countWords = (str: string) => str.trim() ? str.trim().split(/\s+/).length : 0;
  const [saving, setSaving] = useState(false);
  const { data: testSeries = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["test-series", "hierarchy"],
    queryFn: () => HierarchyService.getTestSeriesHierarchy(),
    staleTime: 0,
  });

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => CartService.getCart(),
    enabled: user?.role === "STUDENT",
  });

  const cartCourseIds = new Set(cart?.items?.map((item: any) => item.test_series_id) || []);

  const error = queryError ? "Failed to load test series." : null;

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Available Test Series"
          subtitle="Select a test series to view its curriculum and take practice tests."
        />
        {user?.role === "STUDENT" && (
          <Link href="/student/cart" className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition border border-white/10">
            <ShoppingCart size={16} />
            Cart {cart?.items?.length > 0 && <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">{cart.items.length}</span>}
          </Link>
        )}
      </div>

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
                <label className="text-xs text-zinc-500 mb-1 block">Test Series Code</label>
                <input 
                  type="text" 
                  required
                  value={createForm.code} 
                  onChange={e => setCreateForm({...createForm, code: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-zinc-500 block">Description (Max 30 words)</label>
                  <span className={`text-[10px] ${countWords(createForm.description) > 30 ? 'text-red-500' : 'text-zinc-500'}`}>{countWords(createForm.description)} / 30</span>
                </div>
                <textarea 
                  required
                  value={createForm.description} 
                  onChange={e => setCreateForm({...createForm, description: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50 min-h-[80px]" 
                  placeholder="Enter test series description..."
                />
              </div>

              {user?.role === "ADMIN" && (
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
              )}

              <button 
                onClick={async () => {
                  if (!createForm.name || !createForm.code || !createForm.description) {
                    alert("Name, code and description are required.");
                    return;
                  }
                  if (countWords(createForm.description) > 30) {
                    alert("Test series description cannot exceed 30 words.");
                    return;
                  }
                  setSaving(true);
                  try {
                    const payload: any = { ...createForm };
                    if (user?.role !== "ADMIN") {
                      delete payload.price;
                      delete payload.discount_price;
                      delete payload.status;
                      delete payload.launch_date;
                    } else {
                      payload.price = payload.price === "" ? null : Number(payload.price);
                      payload.discount_price = payload.discount_price === "" ? null : Number(payload.discount_price);
                      if (!payload.launch_date) {
                        payload.launch_date = null;
                      } else {
                        payload.launch_date = new Date(payload.launch_date).toISOString();
                      }
                    }

                    await AdminTestSeriesService.createTestSeries(payload);
                    queryClient.invalidateQueries({ queryKey: ["test-series", "hierarchy"] });
                    setCreatingSeries(false);
                    setCreateForm({ name: "", code: "", description: "", price: "", discount_price: "", status: "DRAFT", launch_date: "" });
                  } catch (e) {
                    alert("Failed to create test series");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50 mt-4"
              >
                {saving ? "Creating..." : "Create Test Series"}
              </button>
            </div>
          </Panel>
        </div>
      )}

      {editingSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Panel className="w-full max-w-md animate-in fade-in zoom-in-95">
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
                <label className="text-xs text-zinc-500 mb-1 block">Test Series Code</label>
                <input 
                  type="text" 
                  required
                  value={editForm.code} 
                  onChange={e => setEditForm({...editForm, code: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-zinc-500 block">Description (Max 30 words)</label>
                  <span className={`text-[10px] ${countWords(editForm.description) > 30 ? 'text-red-500' : 'text-zinc-500'}`}>{countWords(editForm.description)} / 30</span>
                </div>
                <textarea 
                  required
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50 min-h-[80px]" 
                  placeholder="Enter test series description..."
                />
              </div>

              {user?.role === "ADMIN" && (
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
              )}

              <button 
                onClick={async () => {
                  if (countWords(editForm.description) > 30) {
                    alert("Test series description cannot exceed 30 words.");
                    return;
                  }
                  setSaving(true);
                  try {
                    const payload: any = { ...editForm };
                    if (user?.role !== "ADMIN") {
                      delete payload.price;
                      delete payload.discount_price;
                      delete payload.status;
                      delete payload.launch_date;
                    } else {
                      payload.price = payload.price === "" ? null : Number(payload.price);
                      payload.discount_price = payload.discount_price === "" ? null : Number(payload.discount_price);
                      if (!payload.launch_date) {
                        payload.launch_date = null;
                      } else {
                        payload.launch_date = new Date(payload.launch_date).toISOString();
                      }
                    }

                    await AdminTestSeriesService.updateTestSeries(editingSeries.id, payload);
                    queryClient.invalidateQueries({ queryKey: ["test-series", "hierarchy"] });
                    setEditingSeries(null);
                  } catch (e) {
                    alert("Failed to update test series");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Panel>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 hidden rounded-2xl border border-white/10 bg-white/[0.03]"
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
              <p className="text-sm text-zinc-500 text-center mt-2 group-hover:text-zinc-400">Add a new test series to your curriculum.</p>
            </Panel>
          )}
          {(() => {
            const sortedTestSeries = [...testSeries].sort((a: any, b: any) => {
              if (a.is_enrolled && !b.is_enrolled) return -1;
              if (!a.is_enrolled && b.is_enrolled) return 1;
              if (a.is_enrolled && b.is_enrolled) {
                const dateA = a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0;
                const dateB = b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0;
                return dateB - dateA;
              }
              const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
              const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
              return createdB - createdA;
            });
            return sortedTestSeries.map((series: any) => {
              const isCreatorOrAdmin = user?.role === "ADMIN" || user?.id === series.created_by;
              const canSeeCodeAndId = user?.role === "ADMIN" || user?.role === "TEACHER";
              const isStudent = user?.role === "STUDENT";
              
              return (
                <Panel key={series.id} className="relative flex flex-col p-0 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/40 overflow-hidden group bg-gradient-to-br from-zinc-900 to-black">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  {isCreatorOrAdmin && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingSeries(series);
                        setEditForm({ 
                          name: series.name, 
                          code: series.code, 
                          description: series.description || "",
                          price: series.price || "",
                          discount_price: series.discount_price || "",
                          status: series.status || "DRAFT",
                          launch_date: series.launch_date || ""
                        });
                      }}
                      className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-zinc-400 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm"
                      title="Edit Test Series"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}

                  <Link href={`/test-series/${series.id}`} className="flex-1 flex flex-col p-6">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 text-red-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all">
                        <BookOpen size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 tracking-wide leading-relaxed drop-shadow-sm group-hover:from-white group-hover:to-zinc-300 transition-all">{series.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {canSeeCodeAndId && (
                            <span className="whitespace-nowrap shrink-0 text-[10px] uppercase tracking-wider font-semibold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-md">{series.code}</span>
                          )}
                          {!series.is_enrolled && (series.price > 0 || series.discount_price > 0) && (
                            <div className="flex items-center shrink-0 whitespace-nowrap gap-2 text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md text-[11px] font-medium">
                              {series.discount_price > 0 ? (
                                <>
                                  <span className="line-through opacity-50">₹{series.price}</span>
                                  <span className="text-emerald-400">₹{series.discount_price}</span>
                                </>
                              ) : (
                                <span className="text-emerald-400">₹{series.price}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!isStudent && (
                      <div className="mt-auto pt-5 border-t border-white/10 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-400">Curriculum</span>
                          <span className="text-zinc-200 font-semibold bg-white/5 px-2 py-1 rounded-md">{series.sections?.length || 0} Sections</span>
                        </div>
                        {user?.role === "ADMIN" ? (
                          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-white/5 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                            <div className="flex justify-between items-center gap-2">
                              <span className="shrink-0">ID</span>
                              <span className="text-zinc-400 break-all text-right" title={series.id}>{series.id}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Price</span>
                              <span className="text-emerald-400 font-semibold tracking-normal">₹{series.discount_price > 0 ? series.discount_price : (series.price || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Launched</span>
                              <span className="text-zinc-400 tracking-normal">{series.launch_date ? new Date(series.launch_date).toLocaleDateString() : 'TBD'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Enrolled</span>
                              <span className="text-white font-semibold tracking-normal">{series.enrollment_count || 0}</span>
                            </div>
                          </div>
                        ) : user?.role === "TEACHER" && (
                          <div className="flex justify-between items-center gap-2 text-[10px] font-mono mt-3 pt-3 border-t border-white/5">
                            <span className="text-zinc-600 shrink-0">ID</span>
                            <span className="text-zinc-500 break-all text-right" title={series.id}>{series.id}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Link>

                  {isStudent && (
                    <div className="px-6 pb-6 pt-2 z-10">
                      {series.is_enrolled ? (
                        <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-center text-sm font-semibold text-emerald-400 flex items-center justify-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Enrolled
                        </div>
                      ) : (
                        <Link href={`/test-series/${series.id}`} className="block w-full rounded-xl bg-red-600 hover:bg-red-500 transition-all py-2.5 text-center text-sm font-bold text-white shadow shadow-red-500/20">
                          Enroll
                        </Link>
                      )}
                    </div>
                  )}
                </Panel>
              );
            });
          })()}
          {testSeries.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <BookOpen size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No test series available yet.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
