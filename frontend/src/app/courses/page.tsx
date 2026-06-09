"use client";

import { useQuery } from "@tanstack/react-query";
import DashboardShell from "@/components/layout/DashboardShell";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { HierarchyService } from "@/services/hierarchy.service";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  const { data: courses = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ["courses", "hierarchy"],
    queryFn: () => HierarchyService.getFullHierarchy(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const error = queryError ? "Failed to load courses." : null;

  return (
    <DashboardShell activeHref="/courses">
      <SectionTitle
        title="Available Courses"
        subtitle="Select a course to view its curriculum and take practice tests."
      />

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
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Panel className="flex h-full flex-col cursor-pointer transition-transform hover:-translate-y-1 hover:border-red-500/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{course.name}</h3>
                </div>
                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between text-xs text-zinc-500">
                  <span>{course.code}</span>
                  <span>{course.sections?.length || 0} Sections</span>
                </div>
              </Panel>
            </Link>
          ))}
          {courses.length === 0 && (
            <p className="text-zinc-500 col-span-full">No courses available yet.</p>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
