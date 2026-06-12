"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import adminService from "@/services/admin.service";
import {
  Bell, BellOff, Check, CheckCheck, Trophy, Flame,
  ShieldCheck, BookOpen, Megaphone, Star,
} from "lucide-react";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";

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
    queryFn: () => adminService.getNotifications({ limit: 50 }),
    staleTime: 0,
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

        <div className="mt-8 space-y-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 hidden rounded-2xl border border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Panel className="flex flex-col items-center justify-center py-24 text-center border-dashed border-white/10 bg-white/[0.01]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.02] text-zinc-600 mb-6 shadow-inner">
              <BellOff size={40} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">No notifications yet</h3>
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
              You'll receive notifications for rank changes, challenge resolutions, test publications, and more.
            </p>
          </Panel>
        ) : (
          Object.entries(groups).map(([label, items]) => {
            if (!items.length) return null;
            return (
              <div key={label} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xs uppercase tracking-[0.25em] font-bold text-zinc-600 mb-4 ml-1 flex items-center gap-3">
                  {label}
                  <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent"></div>
                </h3>
                <div className="space-y-3">
                  {items.map((n) => {
                    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.CUSTOM;
                    return (
                      <div
                        key={n.id}
                        className="cursor-pointer group relative"
                        onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                      <Panel
                        className={`p-5 transition-all duration-300 ease-out border ${!n.is_read ? "border-red-500/20 bg-gradient-to-r from-red-500/10 to-zinc-900 shadow-[0_0_15px_rgba(239,68,68,0.05)] translate-x-1" : "border-white/5 bg-zinc-950/50 hover:bg-zinc-900/80 hover:border-white/10 hover:-translate-y-0.5"}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-110 ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className={`text-[15px] font-semibold tracking-tight ${n.is_read ? "text-zinc-200 group-hover:text-white" : "text-white"}`}>
                                {n.title}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-medium text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">{timeAgo(n.created_at)}</span>
                                {!n.is_read && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className={`text-sm leading-relaxed ${!n.is_read ? "text-zinc-300 font-medium" : "text-zinc-400"}`}>{n.message}</p>
                            {n.data_json?.question_content && (
                              <div className="mt-3 bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-zinc-300 max-h-40 overflow-y-auto">
                                <ContentBlockRenderer blocks={n.data_json.question_content} />
                              </div>
                            )}
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
