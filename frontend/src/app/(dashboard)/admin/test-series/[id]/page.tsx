"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { AdminTestSeriesService } from "@/services/test-series.admin.service";
import { TestsService } from "@/services/tests.service";
import adminService from "@/services/admin.service";
import { useAuthStore } from "@/store/auth.store";
import { useToast } from "@/hooks/useToast";
import {
  ArrowLeft,
  FileText,
  Users as UsersIcon,
  Plus,
  X,
  Search,
  Trash2,
  Settings,
  Clock,
  HelpCircle,
  BarChart2,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function TestSeriesDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

  // Modals
  const [showAddTest, setShowAddTest] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  // Add test search
  const [testSearch, setTestSearch] = useState("");
  const [addingTestIds, setAddingTestIds] = useState<string[]>([]);

  // Staff
  const [selectedStaffId, setSelectedStaffId] = useState("");

  // Edit form
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "" as number | string,
    discount_price: "" as number | string,
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "HIDDEN",
    launch_date: "",
  });

  const [saving, setSaving] = useState(false);

  // Fetch series detail
  const {
    data: series,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["test_series_detail", id],
    queryFn: () => AdminTestSeriesService.getTestSeriesDetail(id),
  });

  // Fetch available tests for add-test modal
  const { data: availableTests } = useQuery({
    queryKey: ["teacher_tests_search", testSearch],
    queryFn: () => TestsService.getTeacherTests({ search: testSearch, limit: 50 }),
    enabled: showAddTest,
  });

  // Fetch teachers for staff modal
  const { data: teachersData } = useQuery({
    queryKey: ["teachers"],
    queryFn: () => adminService.getUsers({ role: "TEACHER", limit: 100 }),
    enabled: showStaff,
  });

  // Get IDs of tests already in the series
  const seriesTestIds = new Set(series?.tests?.map((t: any) => t.id) || []);

  // Filter available tests to exclude already-added ones
  const filteredTests = (availableTests?.data || []).filter(
    (t: any) => !seriesTestIds.has(t.id)
  );

  const handleAddTests = async () => {
    if (addingTestIds.length === 0) return;
    setSaving(true);
    try {
      await AdminTestSeriesService.addTestsToSeries(id, addingTestIds);
      queryClient.invalidateQueries({ queryKey: ["test_series_detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success(`${addingTestIds.length} test(s) added to series!`);
      setAddingTestIds([]);
      setShowAddTest(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to add tests");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTest = async (testId: string) => {
    try {
      await AdminTestSeriesService.removeTestFromSeries(id, testId);
      queryClient.invalidateQueries({ queryKey: ["test_series_detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Test removed from series!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to remove test");
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) return;
    try {
      await AdminTestSeriesService.assignTestSeriesStaff(id, selectedStaffId);
      queryClient.invalidateQueries({ queryKey: ["test_series_detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Knight assigned successfully!");
      setSelectedStaffId("");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to assign knight");
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    try {
      await AdminTestSeriesService.removeTestSeriesStaff(id, userId);
      queryClient.invalidateQueries({ queryKey: ["test_series_detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Knight removed!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to remove knight");
    }
  };

  const handleEditSave = async () => {
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

      await AdminTestSeriesService.updateTestSeries(id, payload);
      queryClient.invalidateQueries({ queryKey: ["test_series_detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Test series updated!");
      setShowEdit(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this test series? This cannot be undone.")) return;
    try {
      await AdminTestSeriesService.deleteTestSeries(id);
      queryClient.invalidateQueries({ queryKey: ["admin_test_series"] });
      toast.success("Test series deleted!");
      router.push("/admin/test-series");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete");
    }
  };

  const openEdit = () => {
    if (!series) return;
    setEditForm({
      name: series.name,
      description: series.description || "",
      price: series.price || "",
      discount_price: series.discount_price || "",
      status: series.status || "DRAFT",
      launch_date: series.launch_date || "",
    });
    setShowEdit(true);
  };

  const isAdmin = user?.role === "ADMIN";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-white/5" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-white/5" />
            <div className="h-4 w-72 animate-pulse rounded bg-white/5" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
        <div className="h-[400px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText size={48} className="text-zinc-600 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Test Series Not Found</h3>
        <p className="text-sm text-zinc-400 mb-6">The test series you're looking for doesn't exist or you don't have access.</p>
        <Link href="/admin/test-series" className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition">
          ← Back to Test Series
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    DRAFT: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
    PUBLISHED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    HIDDEN: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  };
  const statusColor = statusColors[series.status as string] || statusColors.DRAFT;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/test-series"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{series.name}</h1>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusColor}`}>
                {series.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400 max-w-lg">{series.description || "No description"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <button
              onClick={() => setShowStaff(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              <UsersIcon size={16} /> Knights
            </button>
          )}
          <button
            onClick={openEdit}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Settings size={16} /> Settings
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tests", value: series.tests?.length || 0, icon: FileText, color: "text-red-400" },
          { label: "Enrollments", value: series._count?.enrollments || 0, icon: UsersIcon, color: "text-blue-400" },
          { label: "Knights Assigned", value: series.staff?.length || 0, icon: UsersIcon, color: "text-purple-400" },
          {
            label: "Pricing",
            value: series.discount_price > 0 ? `₹${series.discount_price}` : series.price > 0 ? `₹${series.price}` : "Free",
            icon: BarChart2,
            color: "text-emerald-400",
          },
        ].map((stat) => (
          <Panel key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-lg font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Assigned Knights */}
      {series.staff?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Assigned Knights</h3>
          <div className="flex flex-wrap gap-2">
            {series.staff.map((s: any) => (
              <span
                key={s.user_id}
                className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300"
              >
                <UsersIcon size={12} />
                {s.user?.first_name || "Knight"} {s.user?.last_name || ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tests Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Tests in this Series</h3>
          <button
            onClick={() => {
              setShowAddTest(true);
              setTestSearch("");
              setAddingTestIds([]);
            }}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
          >
            <Plus size={16} /> Add Tests
          </button>
        </div>

        {series.tests?.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center py-16">
            <FileText size={48} className="text-zinc-600 mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">No Tests Added Yet</h3>
            <p className="text-sm text-zinc-500 mb-6 text-center max-w-md">
              Add existing tests to this series. Tests can be created from the Tests page and then linked here.
            </p>
            <button
              onClick={() => {
                setShowAddTest(true);
                setTestSearch("");
                setAddingTestIds([]);
              }}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-red-500"
            >
              <Plus size={16} /> Add Your First Test
            </button>
          </Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {series.tests.map((test: any) => (
              <Panel key={test.id} className="group relative p-5 flex flex-col">
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveTest(test.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Remove from series"
                >
                  <Trash2 size={14} />
                </button>

                <div className="flex items-start gap-3 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-white line-clamp-2 leading-relaxed">{test.title}</h4>
                    {test.topic && (
                      <p className="mt-1 text-[11px] text-zinc-500 line-clamp-1">
                        {test.topic.chapter?.section?.course?.name} → {test.topic.chapter?.section?.name} → {test.topic.chapter?.name} → {test.topic.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
                      <HelpCircle size={12} />
                    </div>
                    <p className="text-xs font-medium text-white">{test._count?.test_questions || 0}</p>
                    <p className="text-[10px] text-zinc-500">Questions</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
                      <Clock size={12} />
                    </div>
                    <p className="text-xs font-medium text-white">{test.duration_minutes}m</p>
                    <p className="text-[10px] text-zinc-500">Duration</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
                      <UsersIcon size={12} />
                    </div>
                    <p className="text-xs font-medium text-white">{test._count?.attempts || 0}</p>
                    <p className="text-[10px] text-zinc-500">Attempts</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      test.status === "PUBLISHED"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : test.status === "DRAFT"
                          ? "text-zinc-400 bg-zinc-500/10 border-zinc-500/20"
                          : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    }`}
                  >
                    {test.status}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                    {test.test_type?.replace("_", " ") || "TOPICWISE"}
                  </span>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      {isAdmin && (
        <div className="mt-12 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-xs text-zinc-500 mb-4">
            Deleting this test series will remove it permanently. Tests inside will NOT be deleted, only unlinked.
          </p>
          <button
            onClick={handleDelete}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
          >
            Delete Test Series
          </button>
        </div>
      )}

      {/* ═══ ADD TEST MODAL ═══ */}
      {showAddTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowAddTest(false)}>
          <Panel
            className="w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white">Add Tests to Series</h3>
              <button onClick={() => setShowAddTest(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                placeholder="Search tests by title..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/50"
              />
            </div>

            {/* Selection count */}
            {addingTestIds.length > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">{addingTestIds.length} test(s) selected</span>
              </div>
            )}

            {/* Test list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 max-h-[400px]">
              {filteredTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText size={32} className="text-zinc-600 mb-3" />
                  <p className="text-sm text-zinc-500">
                    {testSearch ? "No matching tests found." : "No available tests to add."}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">Create tests from the Tests page first.</p>
                </div>
              ) : (
                filteredTests.map((test: any) => {
                  const isSelected = addingTestIds.includes(test.id);
                  return (
                    <div
                      key={test.id}
                      onClick={() => {
                        setAddingTestIds((prev) =>
                          isSelected ? prev.filter((id) => id !== test.id) : [...prev, test.id]
                        );
                      }}
                      className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all border ${
                        isSelected
                          ? "border-red-500/40 bg-red-500/10"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          isSelected ? "border-red-500 bg-red-500 text-white" : "border-white/20 bg-transparent"
                        }`}
                      >
                        {isSelected && <CheckCircle2 size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{test.title}</p>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {test.topic?.chapter?.section?.course?.name || ""} →{" "}
                          {test.topic?.chapter?.name || ""} → {test.topic?.name || ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[11px] text-zinc-500">
                        <span>{test._count?.test_questions || 0} Qs</span>
                        <span>{test.duration_minutes}m</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            test.status === "PUBLISHED"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-zinc-500/10 text-zinc-400"
                          }`}
                        >
                          {test.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add button */}
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setShowAddTest(false)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTests}
                disabled={addingTestIds.length === 0 || saving}
                className="rounded-xl bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? "Adding..." : `Add ${addingTestIds.length} Test(s)`}
              </button>
            </div>
          </Panel>
        </div>
      )}

      {/* ═══ STAFF MODAL ═══ */}
      {showStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowStaff(false)}>
          <Panel
            className="w-full max-w-md animate-in fade-in zoom-in-95 border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white">Manage Knights</h3>
              <button onClick={() => setShowStaff(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Assign Knights (Teachers) to manage this test series. They'll be able to add/remove tests.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="flex-1 rounded-xl bg-zinc-900 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50"
              >
                <option value="">Select a Knight...</option>
                {teachersData?.data?.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name} ({teacher.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignStaff}
                disabled={!selectedStaffId}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition"
              >
                Assign
              </button>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-zinc-400 mb-3">Assigned Knights</h4>
              {series.staff?.length > 0 ? (
                <ul className="space-y-2">
                  {series.staff.map((s: any) => (
                    <li key={s.user_id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 text-sm">
                      <div>
                        <p className="text-white font-medium">
                          {s.user?.first_name || "Knight"} {s.user?.last_name || ""}
                        </p>
                        <p className="text-[11px] text-zinc-500">{s.user?.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveStaff(s.user_id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-500 italic text-center py-4">No Knights assigned yet.</p>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setShowEdit(false)}>
          <Panel
            className="w-full max-w-md animate-in fade-in zoom-in-95 border-red-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Test Series</h3>
              <button onClick={() => setShowEdit(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Test Series Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50 min-h-[80px]"
                  placeholder="Enter description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50"
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
                    value={editForm.launch_date?.toString().split("T")[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, launch_date: e.target.value })}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Base Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Discount Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.discount_price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, discount_price: e.target.value ? Number(e.target.value) : "" })
                    }
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <button
                onClick={handleEditSave}
                disabled={saving}
                className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition disabled:opacity-50 mt-4"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
