"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import adminService from "@/services/admin.service";
import { BookOpen, User, Calendar, CreditCard, ShoppingCart } from "lucide-react";

export default function AdminEnrollmentsPage() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "enrollments", page],
    queryFn: () => adminService.getEnrollments({ page: page + 1, limit }),
  });

  const enrollments = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <SectionTitle
        title="Student Enrollments"
        subtitle={`Track purchased courses and student enrollments (${total} total)`}
        action={
          <button
            disabled={isFetching}
            onClick={() => setPage(0)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      {isLoading ? (
        <div className="mt-6 hidden space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Panel className="mt-6 border border-dashed border-white/10 bg-transparent text-center py-12">
          <ShoppingCart size={32} className="mx-auto text-zinc-600 mb-3" />
          <p className="text-sm font-medium text-zinc-400">No enrollments found.</p>
        </Panel>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Course</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {enrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">
                            {enrollment.user?.first_name || ""} {enrollment.user?.last_name || ""}
                          </p>
                          <p className="text-xs text-zinc-500">{enrollment.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-red-400" />
                        <span className="font-medium text-white">{enrollment.course?.name}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 uppercase">{enrollment.course?.code}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enrollment.course?.price > 0 || enrollment.course?.discount_price > 0 ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CreditCard size={14} />
                          <span>Purchased</span>
                          <span className="text-xs bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 ml-1">
                            ₹{enrollment.course?.discount_price > 0 ? enrollment.course?.discount_price : enrollment.course?.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-300">Free Enrollment</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar size={14} />
                        {new Date(enrollment.enrolled_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-black/40 px-6 py-4 rounded-2xl border border-white/10">
              <span className="text-sm text-zinc-400">
                Page <span className="font-medium text-white">{page + 1}</span> of{" "}
                <span className="font-medium text-white">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 hover:bg-zinc-800 transition"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 hover:bg-zinc-800 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
