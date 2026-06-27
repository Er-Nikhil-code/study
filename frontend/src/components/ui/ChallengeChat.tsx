"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, User as UserIcon } from "lucide-react";
import { api } from "@/lib/api";

interface Message {
  id: string;
  message: string;
  created_at: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    profile_picture: string | null;
  };
}

interface ChallengeChatProps {
  challengeId: string;
  initialMessages: Message[];
  currentUserId: string;
  onMessageAdded?: (msg: Message) => void;
}

export default function ChallengeChat({ challengeId, initialMessages, currentUserId, onMessageAdded }: ChallengeChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync if initialMessages updates
  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const res = await api.post(`/challenges/${challengeId}/messages`, { message: newMessage });
      const addedMsg = res.data;
      setMessages((prev) => [...prev, addedMsg]);
      setNewMessage("");
      if (onMessageAdded) onMessageAdded(addedMsg);
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex flex-col max-h-[400px]">
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <h4 className="text-sm font-semibold text-zinc-300">Discussion</h4>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[150px] scrollbar-thin"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-zinc-500 italic text-center py-4">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === currentUserId;
            const roleColor = 
              msg.user.role === "ADMIN" ? "text-red-400" :
              msg.user.role === "INTERN" ? "text-blue-400" :
              "text-emerald-400";
              
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.user.profile_picture ? (
                    <img src={msg.user.profile_picture} alt={msg.user.first_name || "User"} className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/10" />
                  ) : (
                    <div className="w-6 h-6 rounded-full shrink-0 bg-zinc-800 border border-white/5 text-zinc-400 flex items-center justify-center">
                      <UserIcon size={12} />
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-zinc-500 mb-1 flex items-center gap-1.5">
                      <span className="text-zinc-400 font-medium">{msg.user.first_name} {msg.user.last_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] bg-white/5 uppercase tracking-wider font-bold ${roleColor}`}>{msg.user.role}</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-red-500/20 text-red-100 rounded-br-sm' : 'bg-white/10 text-zinc-200 rounded-bl-sm'}`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-red-500/50 transition-colors"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className={`w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-zinc-800 disabled:text-zinc-600 flex items-center justify-center text-white transition-colors shrink-0`}
        >
          <Send size={14} className="-ml-0.5" />
        </button>
      </form>
    </div>
  );
}
