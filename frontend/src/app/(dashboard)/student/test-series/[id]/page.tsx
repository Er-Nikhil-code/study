"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import { studentService } from "@/services/student.service";
import TestSeriesCard from "@/components/tests/TestSeriesCard";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TabType = "TOPICWISE" | "UNITWISE" | "FULL_SYLLABUS";

export default function TestSeriesDetailPage() {
  const params = useParams();
  const testSeriesId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>("TOPICWISE");

  const { data: testSeriesData, isLoading, error } = useQuery({
    queryKey: ["testSeriesTests", testSeriesId, activeTab],
    queryFn: () => studentService.getTestSeriesTests({ test_type: activeTab, test_series_id: testSeriesId, limit: 100 }),
  });

  const tests = testSeriesData?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/student/test-series"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <SectionTitle
          title="Test Series Details"
          subtitle="Practice your skills with topicwise, unitwise, and full syllabus mock tests."
        />
      </div>

      <div className="flex space-x-1 rounded-xl bg-white/[0.03] p-1 border border-white/5">
        {[
          { id: "TOPICWISE", label: "Topicwise" },
          { id: "UNITWISE", label: "Unitwise" },
          { id: "FULL_SYLLABUS", label: "Full Syllabus" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-red-600 text-white shadow"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          Failed to load tests.
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
          {tests.map((test) => (
            <TestSeriesCard key={test.id} test={test} />
          ))}
          {tests.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <FileText size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="text-sm font-medium text-zinc-400">No {activeTab.toLowerCase().replace('_', ' ')} tests available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
