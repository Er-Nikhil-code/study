"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import adminService from "@/services/admin.service";
import {
  Bell, BellOff, Check, CheckCheck, Trophy, Flame,
  ShieldCheck, BookOpen, Megaphone, Star,
} from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  RANK_UPDATE:        { icon: <Trophy size={16} />,    color: "text-yellow-400 bg-yellow-400/10" },
  BADGE_EARNED:       { icon: <Star size={16} />,      color: "text-purple-400 bg-purple-400/10" },
  STREAK_MILESTONE:   { icon: <Flame size={16} />,     color: "text-orange-400 bg-orange-400/10" },
  CHALLENGE_RESOLVED: { icon: <ShieldCheck size={16} />, color: "text-emerald-400 bg-emerald-400/10" },
  TEACHER_APPROVED:   { icon: <CheckCheck size={16} />, color: "text-emerald-400 bg-emerald-400/10" },
  TEST_PUBLISHED:     { icon: <BookOpen size={16} />,  color: "text-blue-400 bg-blue-400/10" },
  CUSTOM:             { icon: <Megaphone size={16} />, color: "text-zinc-400 bg-zinc-400/10" },
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function groupByDate(notifications: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups: Record<string, any[]> = { Today: [], Yesterday: [], Earlier: [] };
  for (const n of notifications) {
    const d = new Date(n.created_at);
    if (d >= today) groups.Today.push(n);
    else if (d >= yesterday) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  }
  return groups;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => adminService.getNotifications({ take: 50 }),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    retry: 2,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminService.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => adminService.markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unread_count || 0;
  const groups = groupByDate(notifications);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <SectionTitle
          title="Notifications"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up!"
          }
        />
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] text-zinc-600 mb-4">
              <BellOff size={32} />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No notifications yet</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              You'll receive notifications for rank changes, challenge resolutions, test publications, and more.
            </p>
          </Panel>
        ) : (
          Object.entries(groups).map(([label, items]) => {
            if (!items.length) return null;
            return (
              <div key={label}>
                <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-600 mb-3">{label}</h3>
                <div className="space-y-2">
                  {items.map((n) => {
                    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.CUSTOM;
                    return (
                      <div
                        key={n.id}
                        className="cursor-pointer"
                        onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                      >
                      <Panel
                        className={`p-4 transition ${!n.is_read ? "border-white/[0.12] bg-white/[0.05]" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-medium ${n.is_read ? "text-zinc-300" : "text-white"}`}>
                                {n.title}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-zinc-600">{timeAgo(n.created_at)}</span>
                                {!n.is_read && (
                                  <div className="h-2 w-2 rounded-full bg-red-500" title="Unread" />
                                )}
                              </div>
                            </div>
                            <p className="mt-0.5 text-xs text-zinc-500">{n.message}</p>
                          </div>
                        </div>
                      </Panel>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
