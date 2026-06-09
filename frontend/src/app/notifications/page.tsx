"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <DashboardShell activeHref="/notifications">
      <SectionTitle
        title="Notifications"
        subtitle="Stay updated with your latest alerts and announcements."
      />
      <div className="mt-6">
        <Panel className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] text-zinc-500 mb-4">
            <Bell size={32} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No new notifications</h3>
          <p className="text-zinc-500 text-sm max-w-sm">
            You're all caught up! We'll notify you when there's an update regarding your tests, challenges, or account.
          </p>
        </Panel>
      </div>
    </DashboardShell>
  );
}
