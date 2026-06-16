"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SectionTitle from "@/components/ui/SectionTitle";
import Panel from "@/components/ui/Panel";
import adminService from "@/services/admin.service";
import studentService from "@/services/student.service";
import {
  Bell, BellOff, Check, CheckCheck, Trophy, Flame,
  ShieldCheck, BookOpen, Megaphone, Star, Trash2, Send
} from "lucide-react";
import { ContentBlockRenderer } from "@/components/ui/LatexRenderer";
import { useAuthStore } from "@/store/auth.store";

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
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

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

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => adminService.clearAllNotifications(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const sendCustomMutation = useMutation({
    mutationFn: (data: { title: string; message: string; role?: string }) => adminService.sendCustomNotification(data.title, data.message, data.role),
    onSuccess: () => {
      alert("Custom notification sent!");
      setShowCustomModal(false);
      setCustomForm({ title: "", message: "", role: "ALL" });
    },
    onError: (err: any) => alert(err?.response?.data?.message || "Failed to send notification"),
  });

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ title: "", message: "", role: "ALL" });

  const notifications = data?.data || [];
  const unreadCount = data?.unread_count || 0;
  const groups = groupByDate(notifications);

  // Challenges State
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [viewChallenge, setViewChallenge] = useState<any>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    studentService
      .getMyChallenges()
      .then((data) => setChallenges(data))
      .catch(() => {})
      .finally(() => setLoadingChallenges(false));
  }, []);

  const handleWithdraw = async (challengeId: string) => {
    if (!confirm("Are you sure you want to withdraw this challenge?")) return;
    setWithdrawingId(challengeId);
    try {
      await studentService.withdrawChallenge(challengeId);
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
      if (viewChallenge?.id === challengeId) setViewChallenge(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to withdraw challenge");
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left Column: Notifications */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <SectionTitle
            title="Notifications"
            subtitle={
              unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up!"
            }
          />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowCustomModal(true)}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Send size={14} />
                Send Custom
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            )}
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
                          className="group relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                        <Panel
                          className={`p-5 transition-all duration-300 ease-out border ${!n.is_read ? "border-red-500/20 bg-gradient-to-r from-red-500/10 to-zinc-900 shadow-[0_0_15px_rgba(239,68,68,0.05)] translate-x-1" : "border-white/5 bg-zinc-950/50 hover:bg-zinc-900/80 hover:border-white/10 hover:-translate-y-0.5"}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-110 ${config.color}`}>
                              {config.icon}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5 cursor-pointer" onClick={() => !n.is_read && markReadMutation.mutate(n.id)}>
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
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteNotificationMutation.mutate(n.id); }}
                                    disabled={deleteNotificationMutation.isPending}
                                    className="p-1 rounded bg-black/40 text-zinc-500 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete notification"
                                  >
                                    <Trash2 size={14} />
                                  </button>
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
      </div>

      {/* Right Column: Challenges */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <SectionTitle title="Challenges" subtitle="Questions challenged & status" />
        </div>
        
        <div className="mt-8 space-y-3">
          {loadingChallenges ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <Panel className="flex flex-col items-center justify-center py-24 text-center border-dashed border-white/10 bg-white/[0.01]">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.02] text-zinc-600 mb-6 shadow-inner">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">No challenges</h3>
              <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
                You haven't challenged any questions yet.
              </p>
            </Panel>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xs uppercase tracking-[0.25em] font-bold text-zinc-600 mb-4 ml-1 flex items-center gap-3">
                RECENT
                <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent"></div>
              </h3>
              <div className="space-y-3">
                {challenges.map((c) => (
                  <div key={c.id} className="cursor-pointer group relative" onClick={() => setViewChallenge(c)}>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                    <Panel className="p-5 transition-all duration-300 ease-out border border-white/5 bg-zinc-950/50 hover:bg-zinc-900/80 hover:border-white/10 hover:-translate-y-0.5">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner transition-transform group-hover:scale-110 ${c.note ? 'text-blue-400 bg-blue-400/10' : 'text-orange-400 bg-orange-400/10'}`}>
                          {c.note ? <BookOpen size={16} /> : <ShieldCheck size={16} />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <p className="text-[15px] font-semibold tracking-tight text-zinc-200 group-hover:text-white">
                                {c.question?.topic?.name || c.note?.topic?.name || "Unknown Topic"}
                              </p>
                              {c.status === "PENDING" && <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-yellow-300 text-[10px]">Pending</span>}
                              {c.status === "RESOLVED" && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-emerald-300 text-[10px]">Resolved</span>}
                              {c.status === "REJECTED" && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-red-300 text-[10px]">Rejected</span>}
                              {c.status === "ESCALATED" && <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-purple-300 text-[10px]">Escalated</span>}
                            </div>
                            <span className="text-[11px] font-medium text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                              {timeAgo(c.created_at)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed text-zinc-400 truncate" title={c.reason || "Review Request"}>
                            {c.question?.content_json?.[0]?.data?.text || c.note?.title || c.reason || "Review Request"}
                          </p>
                          {c.status === "PENDING" && (
                            <div className="mt-3 flex gap-3">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleWithdraw(c.id); }} 
                                disabled={withdrawingId === c.id}
                                className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 font-medium disabled:opacity-50"
                              >
                                {withdrawingId === c.id ? "Withdrawing..." : "Withdraw"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Panel>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Challenge Modal */}
      {viewChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl relative my-auto">
            <button onClick={() => setViewChallenge(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition text-xl leading-none">&times;</button>
            <h3 className="text-xl font-bold text-white mb-2">Challenge Details</h3>
            
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wider text-zinc-500 mb-6 pb-6 border-b border-white/10">
              <div>Status: <span className="text-white">{viewChallenge.status}</span></div>
              <div>Date: <span className="text-white">{new Date(viewChallenge.created_at).toLocaleDateString()}</span></div>
              {viewChallenge.question && <div>Question ID: <span className="text-white font-mono">{viewChallenge.question.id}</span></div>}
              {viewChallenge.note && <div>Note ID: <span className="text-white font-mono">{viewChallenge.note.id}</span></div>}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Your Challenge Reason</h4>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-200">
                  <span className="font-semibold">{viewChallenge.reason}</span>: {viewChallenge.description}
                </div>
              </div>

              {viewChallenge.resolution_note && (
                <div>
                  <h4 className="text-xs uppercase tracking-wide text-emerald-500 mb-2">Resolution Note</h4>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-200">
                    {viewChallenge.resolution_note}
                  </div>
                </div>
              )}

              {viewChallenge.question && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">Question Content</h4>
                  <div className="text-base text-zinc-200 mb-6">
                    <ContentBlockRenderer blocks={viewChallenge.question.content_json || []} />
                  </div>

                  <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">Options</h4>
                  <div className="space-y-2 mb-6">
                    {(() => {
                      const q = viewChallenge.question;
                      if (!q.options_json?.options) return <div className="text-sm text-zinc-400">Options not available.</div>;
                      
                      return q.options_json.options.map((opt: any) => {
                        let isCorrect = false;
                        if (Array.isArray(q.answer_key?.correct_options)) {
                          isCorrect = q.answer_key.correct_options.includes(opt.id);
                        } else {
                          isCorrect = q.answer_key?.correct_option === opt.id;
                        }
                        return (
                          <div key={opt.id} className={`p-3 rounded-lg border ${isCorrect ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-zinc-300'}`}>
                            {opt.text}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {viewChallenge.question.solution_json && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">Solution</h4>
                      <div className="text-sm text-zinc-300 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                        {typeof viewChallenge.question.solution_json === 'string' ? viewChallenge.question.solution_json : <ContentBlockRenderer blocks={Array.isArray(viewChallenge.question.solution_json) ? viewChallenge.question.solution_json : []} />}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewChallenge.note && (
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                  <h4 className="text-xs uppercase tracking-wide text-zinc-500 mb-4">Note Content</h4>
                  <div className="text-base text-zinc-200 mb-6">
                    <div className="font-bold mb-4 text-white text-lg">{viewChallenge.note.title}</div>
                    <div className="prose max-w-none prose-invert text-zinc-300" dangerouslySetInnerHTML={{ __html: viewChallenge.note.content_html }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={() => setViewChallenge(null)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Custom Notification Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-4">Send Custom Notification</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Target Audience</label>
                <select 
                  value={customForm.role}
                  onChange={e => setCustomForm({...customForm, role: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                >
                  <option value="ALL">All Users</option>
                  <option value="STUDENT">Students Only</option>
                  <option value="TEACHER">Teachers Only</option>
                  <option value="INTERN">Interns Only</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Title</label>
                <input 
                  type="text" 
                  value={customForm.title}
                  onChange={e => setCustomForm({...customForm, title: e.target.value})}
                  placeholder="E.g. System Maintenance"
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Message</label>
                <textarea 
                  value={customForm.message}
                  onChange={e => setCustomForm({...customForm, message: e.target.value})}
                  placeholder="Enter your message here..."
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-2.5 text-sm text-white focus:border-indigo-500/50 outline-none min-h-[100px]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={() => sendCustomMutation.mutate(customForm)}
                disabled={!customForm.title || !customForm.message || sendCustomMutation.isPending}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition disabled:opacity-50"
              >
                {sendCustomMutation.isPending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
