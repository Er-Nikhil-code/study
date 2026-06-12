"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import Link from "next/link";
import { BookOpen, Edit2, X, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { CartService } from "@/services/cart.service";

export default function CoursesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editForm, setEditForm] = useState({ 
    name: "", code: "", description: "",
    price: "" as number | string, discount_price: "" as number | string, status: "DRAFT" as "DRAFT" | "PUBLISHED" | "HIDDEN", launch_date: ""
  });
  const countWords = (str: string) => str.trim() ? str.trim().split(/\s+/).length : 0;
  const [saving, setSaving] = useState(false);
  const { data: courses = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["courses", "hierarchy"],
    queryFn: () => HierarchyService.getFullHierarchy(),
    staleTime: 0,
  });

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => CartService.getCart(),
    enabled: user?.role === "STUDENT",
  });

  const cartCourseIds = new Set(cart?.items?.map((item: any) => item.course_id) || []);

  const error = queryError ? "Failed to load courses." : null;

  return (
    <>
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Available Courses"
          subtitle="Select a course to view its curriculum and take practice tests."
        />
        {user?.role === "STUDENT" && (
          <Link href="/student/cart" className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition border border-white/10">
            <ShoppingCart size={16} />
            Cart {cart?.items?.length > 0 && <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">{cart.items.length}</span>}
          </Link>
        )}
      </div>

      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Panel className="w-full max-w-md animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Course</h3>
              <button onClick={() => setEditingCourse(null)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Course Name</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                  className="w-full rounded bg-zinc-900 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-red-500/50" 
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Course Code</label>
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
                  placeholder="Enter course description..."
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
                    alert("Course description cannot exceed 30 words.");
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

                    await HierarchyService.updateCourse(editingCourse.id, payload);
                    queryClient.invalidateQueries({ queryKey: ["courses", "hierarchy"] });
                    setEditingCourse(null);
                  } catch (e) {
                    alert("Failed to update course");
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
              className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {courses.map((course: any) => {
            const isCreatorOrAdmin = user?.role === "ADMIN" || user?.id === course.created_by;
            const canSeeCodeAndId = user?.role === "ADMIN" || user?.role === "TEACHER";
            const isStudent = user?.role === "STUDENT";
            
            return (
              <Panel key={course.id} className="relative flex flex-col p-0 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/40 overflow-hidden group bg-gradient-to-br from-zinc-900 to-black">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                
                {isCreatorOrAdmin && (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingCourse(course);
                      setEditForm({ 
                        name: course.name, 
                        code: course.code, 
                        description: course.description || "",
                        price: course.price || "",
                        discount_price: course.discount_price || "",
                        status: course.status || "DRAFT",
                        launch_date: course.launch_date || ""
                      });
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-zinc-400 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm"
                    title="Edit Course"
                  >
                    <Edit2 size={14} />
                  </button>
                )}

                <Link href={`/courses/${course.id}`} className="flex-1 flex flex-col p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/30 text-red-400 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all">
                      <BookOpen size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight line-clamp-2 leading-snug group-hover:text-red-100 transition-colors">{course.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {canSeeCodeAndId && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">{course.code}</span>
                        )}
                        {(course.price > 0 || course.discount_price > 0) && (
                          <div className="flex items-center gap-2 text-zinc-400 bg-white/5 px-2 py-0.5 rounded text-xs font-medium">
                            {course.discount_price > 0 ? (
                              <>
                                <span className="line-through opacity-50">₹{course.price}</span>
                                <span className="text-emerald-400">₹{course.discount_price}</span>
                              </>
                            ) : (
                              <span className="text-emerald-400">₹{course.price}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-5 border-t border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Curriculum</span>
                      <span className="text-zinc-200 font-semibold bg-white/5 px-2 py-1 rounded-md">{course.sections?.length || 0} Sections</span>
                    </div>
                    {canSeeCodeAndId && (
                      <div className="flex justify-between items-center text-[10px] font-mono mt-1">
                        <span className="text-zinc-600">ID</span>
                        <span className="text-zinc-500 truncate max-w-[120px]">{course.id}</span>
                      </div>
                    )}
                  </div>
                </Link>

                {isStudent && (
                  <div className="px-6 pb-6 pt-2 z-10">
                    {course.is_enrolled ? (
                      <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-center text-sm font-semibold text-emerald-400 flex items-center justify-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Enrolled
                      </div>
                    ) : cartCourseIds.has(course.id) ? (
                      <Link href="/student/cart" className="block w-full rounded-xl bg-white/10 py-2.5 text-center text-sm font-bold text-white shadow hover:bg-white/20 transition-all border border-white/10">
                        Go to Cart
                      </Link>
                    ) : (
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            if (course.price > 0 || course.discount_price > 0) {
                              await CartService.addToCart(course.id);
                              queryClient.invalidateQueries({ queryKey: ["cart"] });
                            } else {
                              // Free course enrollment
                              await HierarchyService.enrollCourse(course.id);
                              queryClient.invalidateQueries({ queryKey: ["courses", "hierarchy"] });
                            }
                          } catch (err) {
                            alert("Failed to add to cart or enroll. Please try again.");
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-500 hover:to-red-400 transition-all active:scale-[0.98]"
                      >
                        {(course.price > 0 || course.discount_price > 0) ? (
                          <>
                            <ShoppingCart size={16} /> Add to Cart
                          </>
                        ) : "Enroll for Free"}
                      </button>
                    )}
                  </div>
                )}
              </Panel>
            );
          })}
          {courses.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <BookOpen size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No courses available yet.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
