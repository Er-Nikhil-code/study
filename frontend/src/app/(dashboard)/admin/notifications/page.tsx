"use client";

import { useState, useEffect } from "react";
import Panel from "@/components/ui/Panel";
import SectionTitle from "@/components/ui/SectionTitle";
import adminService from "@/services/admin.service";
import { Send, AlertCircle, CheckCircle, Inbox, Send as SendIcon, PenSquare, Search, User as UserIcon } from "lucide-react";

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "compose">("compose");

  // Compose State
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [statusVisible, setStatusVisible] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Inbox & Sent State
  const [inbox, setInbox] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [fetchingLists, setFetchingLists] = useState(false);

  useEffect(() => {
    if (activeTab === "inbox" || activeTab === "sent") {
      fetchLists();
    }
  }, [activeTab]);

  useEffect(() => {
    if (status) {
      setStatusVisible(true);
      if (status.type === "success") {
        const timer1 = setTimeout(() => setStatusVisible(false), 2000);
        const timer2 = setTimeout(() => setStatus(null), 2500);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [status]);

  const fetchLists = async () => {
    setFetchingLists(true);
    try {
      if (activeTab === "inbox") {
        const data = await adminService.getReceivedNotifications();
        setInbox(data);
      } else if (activeTab === "sent") {
        const data = await adminService.getSentNotifications();
        setSent(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setFetchingLists(false);
    }
  };

  // Debounced Search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await adminService.getUsers({ search: searchQuery, take: 5 });
        setSearchResults(res.data);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser && !userId) {
      setStatus({ type: "error", text: "Please select a valid user." });
      return;
    }
    
    const finalUserId = selectedUser ? selectedUser.id : userId;

    setLoading(true);
    setStatus(null);
    try {
      await adminService.sendNotification(finalUserId, title, message);
      setStatus({ type: "success", text: "Notification sent successfully." });
      setUserId("");
      setSearchQuery("");
      setSelectedUser(null);
      setTitle("");
      setMessage("");
    } catch (err: any) {
      setStatus({ type: "error", text: err.response?.data?.message || "Failed to send notification." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification? It will also be removed from the receiver's inbox.")) return;
    try {
      await adminService.deleteSentNotification(id);
      setSent((prev) => prev.filter((n) => n.id !== id));
      setStatus({ type: "success", text: "Notification deleted successfully." });
    } catch (err: any) {
      setStatus({ type: "error", text: err.response?.data?.message || "Failed to delete notification." });
    }
  };

  return (
    <>
      <SectionTitle
        title="Notification Center"
        subtitle="Manage and send custom notifications to users."
      />

      <div className="mt-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("compose")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === "compose"
                ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-white border border-white/5"
            }`}
          >
            <PenSquare size={18} /> Compose
          </button>
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === "inbox"
                ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-white border border-white/5"
            }`}
          >
            <Inbox size={18} /> Received
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
              activeTab === "sent"
                ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900 hover:text-white border border-white/5"
            }`}
          >
            <SendIcon size={18} /> Sent
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4">
          {status && (
            <div className={`transition-all duration-500 transform ${statusVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {status.text}
            </div>
          )}

          {activeTab === "compose" && (
            <Panel className="max-w-2xl bg-zinc-950 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Compose Notification</h2>
              <form onSubmit={handleSend} className="space-y-6">

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Recipient (User ID or Name)</label>
                  <div className="relative">
                    {!selectedUser ? (
                      <>
                        <div className="relative flex items-center">
                          <Search size={18} className="absolute left-4 text-zinc-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type a name, email, or User ID..."
                            className="w-full rounded-xl bg-zinc-900 border border-white/10 pl-11 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50"
                          />
                        </div>
                        
                        {/* Autocomplete Dropdown */}
                        {searchQuery.trim().length >= 2 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                            {isSearching ? (
                              <div className="p-4 text-center text-sm text-zinc-500 animate-pulse">Searching...</div>
                            ) : searchResults.length > 0 ? (
                              <div className="max-h-64 overflow-y-auto">
                                {searchResults.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setSearchQuery("");
                                    }}
                                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 border-b border-white/5 last:border-0 text-left transition-colors"
                                  >
                                    <div>
                                      <div className="text-white font-medium">{u.first_name} {u.last_name}</div>
                                      <div className="text-xs text-zinc-500">{u.email}</div>
                                    </div>
                                    <div className="text-[10px] text-zinc-600 font-mono bg-black/50 px-2 py-1 rounded">
                                      {u.id}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-sm text-zinc-500">No users found.</div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <UserIcon size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-emerald-100">{selectedUser.first_name} {selectedUser.last_name}</div>
                            <div className="text-xs text-emerald-500/70">{selectedUser.email} &bull; <span className="font-mono">{selectedUser.id}</span></div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="text-xs font-medium text-red-400 hover:text-red-300 bg-red-400/10 px-3 py-1.5 rounded-lg transition"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
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
                    rows={5}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedUser}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 font-bold text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-500 hover:to-red-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? "Sending..." : (
                    <>
                      <Send size={18} /> Dispatch Notification
                    </>
                  )}
                </button>
              </form>
            </Panel>
          )}

          {activeTab === "inbox" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-6">Received Notifications</h2>
              {fetchingLists ? (
                <div className="h-32 rounded-xl bg-zinc-900/50 animate-pulse border border-white/5" />
              ) : inbox.length === 0 ? (
                <Panel className="text-center py-12 border-dashed border-white/10 bg-white/[0.01]">
                  <Inbox className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-400 font-medium">Your inbox is empty.</p>
                </Panel>
              ) : (
                inbox.map((n) => (
                  <Panel key={n.id} className="border border-white/5 bg-zinc-950/50 hover:bg-zinc-900/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium mb-1">{n.title}</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">{n.message}</p>
                      </div>
                      <span className="text-[10px] text-zinc-600 whitespace-nowrap ml-4">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Panel>
                ))
              )}
            </div>
          )}

          {activeTab === "sent" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-6">Sent Notifications</h2>
              {fetchingLists ? (
                <div className="h-32 rounded-xl bg-zinc-900/50 animate-pulse border border-white/5" />
              ) : sent.length === 0 ? (
                <Panel className="text-center py-12 border-dashed border-white/10 bg-white/[0.01]">
                  <SendIcon className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
                  <p className="text-zinc-400 font-medium">You haven't sent any notifications yet.</p>
                </Panel>
              ) : (
                sent.map((n) => (
                  <Panel key={n.id} className="border border-white/5 bg-zinc-950/50 hover:bg-zinc-900/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-white font-medium mb-1">{n.title}</h4>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-3">{n.message}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold bg-white/5 text-zinc-400 px-2 py-0.5 rounded">
                            Sent to
                          </span>
                          <span className="text-xs text-zinc-300 font-medium">
                            {n.user ? `${n.user.first_name} ${n.user.last_name} (${n.user.email})` : n.user_id}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteSent(n.id)}
                          className="text-xs text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Panel>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
