"use client";

import { useQuery } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import { studentService } from "@/services/student.service";
import { FileText, ArrowRight, Lock, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export default function TestSeriesPage() {
  const router = useRouter();
  const toast = useToast();
  
  const { data: testSeriesData, isLoading, error, refetch } = useQuery({
    queryKey: ["testSeries"],
    queryFn: () => studentService.getTestSeries({ limit: 50 }),
  });

  const handleEnroll = async (id: string) => {
    try {
      await studentService.enrollInTestSeries(id);
      toast.success("Successfully enrolled in Test Series!");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to enroll in Test Series");
    }
  };

  const seriesList = testSeriesData?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Test Series"
        subtitle="Explore and enroll in curated test series to boost your preparation."
      />

      {error && (
        <div className="rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          Failed to load test series.
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[250px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {seriesList.map((series: any) => (
            <div
              key={series.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/20 text-red-500">
                  <FileText className="h-6 w-6" />
                </div>
                {series.is_enrolled ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                    Enrolled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2.5 py-1 text-xs font-medium text-zinc-400 border border-zinc-500/20">
                    <Lock size={12} />
                    Locked
                  </span>
                )}
              </div>

              <h3 className="mb-2 text-lg font-bold text-white line-clamp-1">{series.name}</h3>
              <p className="mb-6 text-sm text-zinc-400 line-clamp-2">
                {series.description || "Comprehensive test series for complete preparation."}
              </p>

              <div className="mb-6 flex items-center gap-4 text-xs font-medium text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  {series.test_count} Tests
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5">
                {series.is_enrolled ? (
                  <Link
                    href={`/student/test-series/${series.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
                  >
                    View Tests
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handleEnroll(series.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]"
                  >
                    Enroll Now
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {seriesList.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <FileText size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No test series available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
