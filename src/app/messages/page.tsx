"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, ArrowLeft, Clock, Check, CheckCheck, User, Calendar, RefreshCw } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";

interface Conversation {
  id: number;
  bookingId: number | null;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  participant1Read: boolean;
  participant2Read: boolean;
  closed: boolean;
  otherUser: { id: string; name: string; image: string | null } | null;
  unread: boolean;
}

interface Message {
  id: number;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  senderName: string;
}

function formatTime(dateStr: string, now: number) {
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatMessageTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: number) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // silent
    }
    setMessagesLoading(false);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    if (activeConvId !== null) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId, fetchMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvId, message: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, lastMessageAt: new Date().toISOString(), lastMessagePreview: newMessage.trim().slice(0, 200), unread: false }
              : c
          )
        );
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch {
      // silent
    }
    setSending(false);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Mobile: show conversation if active, otherwise list
  const showList = activeConvId === null;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Messages</h2>
        <p className="text-gray-500">Please sign in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden min-h-[600px] flex">
        {/* Conversation List */}
        <div className={`${showList ? "flex" : "hidden"} md:flex flex-col w-full md:w-80 border-r border-gray-100 dark:border-neutral-800`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <h1 className="text-sm font-bold text-gray-900 dark:text-white">Messages</h1>
            <button
              onClick={fetchConversations}
              className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-8 h-8 text-gray-200 dark:text-neutral-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                  Start a conversation from a booking
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors text-left ${
                    activeConvId === conv.id ? "bg-rose-50 dark:bg-rose-950/20" : ""
                  } ${conv.unread ? "bg-rose-50/30 dark:bg-rose-950/10" : ""}`}
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                    {conv.otherUser?.image ? (
                      <img src={conv.otherUser.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${conv.unread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {conv.otherUser?.name || "User"}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                        {formatTime(conv.lastMessageAt, now)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {conv.lastMessagePreview || "No messages yet"}
                      </p>
                      {conv.bookingId && (
                        <Calendar className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
                      )}
                    </div>
                  </div>
                  {conv.unread && (
                    <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className={`${showList ? "hidden" : "flex"} md:flex flex-col flex-1`}>
          {activeConvId !== null && activeConv ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
                <button
                  onClick={() => setActiveConvId(null)}
                  className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                  {activeConv.otherUser?.image ? (
                    <img src={activeConv.otherUser.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{activeConv.otherUser?.name || "User"}</p>
                  {activeConv.bookingId && (
                    <p className="text-[10px] text-gray-400">Booking #{activeConv.bookingId}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <Skeleton className="h-10 w-48 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="w-8 h-8 text-gray-200 dark:text-neutral-700 mb-2" />
                    <p className="text-sm text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Send the first message below</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                            isMe
                              ? "bg-rose-500 text-white rounded-br-md"
                              : "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                            <span className={`text-[10px] ${isMe ? "text-rose-200" : "text-gray-400 dark:text-gray-500"}`}>
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {isMe && (
                              msg.readAt
                                ? <CheckCheck className="w-3 h-3 text-rose-200" />
                                : <Check className="w-3 h-3 text-rose-200" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-neutral-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 border border-gray-200 dark:border-neutral-700"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-2.5 rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-gray-200 dark:text-neutral-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
