"use client";

import { useState } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import adminService from "@/services/admin.service";
import { Send, AlertCircle, CheckCircle } from "lucide-react";

export default function AdminNotificationsPage() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await adminService.sendNotification(userId, title, message);
      setStatus({ type: "success", text: "Notification sent successfully." });
      setUserId("");
      setTitle("");
      setMessage("");
    } catch (err: any) {
      setStatus({ type: "error", text: err.response?.data?.message || "Failed to send notification." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SectionTitle
        title="Send Notifications"
        subtitle="Manually dispatch notifications to specific users"
      />

      <Panel className="mt-8 max-w-2xl">
        <form onSubmit={handleSend} className="space-y-6">
          {status && (
            <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {status.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Target User ID</label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. cm0abc123..."
              className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50"
            />
            <p className="mt-2 text-xs text-zinc-500">You can find the User ID in the User Management list.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Notification Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Important Update"
              className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Message Body</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-500 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : (
              <>
                <Send size={18} /> Send Notification
              </>
            )}
          </button>
        </form>
      </Panel>
    </>
  );
}
