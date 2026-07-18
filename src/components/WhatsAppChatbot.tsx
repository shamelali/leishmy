"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useToast } from "@/context/ToastContext";

const WHATSAPP_NUMBER = "601137633788";
const DEFAULT_MESSAGE = "Hi! I'm interested in booking a makeup artist through Leish. Could you help me?";

export function WhatsAppChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [showNotification, setShowNotification] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard hydration-guard pattern: first client render must match server (null)
    setMounted(true);
    const timer = setTimeout(() => setShowNotification(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const openWhatsApp = async () => {
    setIsLoading(true);
    try {
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Opening WhatsApp...");
      setIsOpen(false);
      setShowNotification(false);
    } catch {
      toast.error("Failed to open WhatsApp");
    } finally {
      setIsLoading(false);
    }
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(`+${WHATSAPP_NUMBER}`);
    toast.success("WhatsApp number copied!");
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          p-4 rounded-full
          bg-green-500 hover:bg-green-600
          text-white shadow-xl shadow-green-500/30
          transition-all duration-300
          hover:scale-110 active:scale-95
          animate-bounce-gentle
          ${isOpen ? "rotate-45 bg-green-600" : ""}
        `}
        aria-label={isOpen ? "Close WhatsApp chat" : "Open WhatsApp chat"}
      >
        <MessageCircle className="w-7 h-7" aria-hidden="true" />
      </button>

      {/* Notification Badge */}
      {showNotification && !isOpen && (
        <div
          className="
            fixed bottom-20 right-6 z-40
            bg-white dark:bg-neutral-900
            rounded-xl shadow-xl border border-gray-100 dark:border-neutral-800
            p-4 min-w-[280px] max-w-[320px]
            animate-slide-in-right
          "
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                Need help booking?
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Chat with us on WhatsApp for instant booking assistance
              </p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="
              fixed bottom-6 right-6 z-50
              w-full max-w-sm sm:max-w-md
              bg-white dark:bg-neutral-900
              rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800
              overflow-hidden animate-scale-in
              flex flex-col
            "
            role="dialog"
            aria-label="WhatsApp Chat"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-green-500 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Leish Support</p>
                  <p className="text-xs text-green-100">Typically replies within minutes</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Hi! 👋 Welcome to Leish. How can we help you book your perfect makeup artist today?
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-green-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm">{message}</p>
                </div>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-100 dark:border-neutral-800 p-4 space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="
                  w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800
                  border border-gray-200 dark:border-neutral-700
                  rounded-xl text-sm text-gray-900 dark:text-white
                  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
                  resize-none min-h-[80px] max-h-[120px]
                "
                rows={3}
              />
              <button
                onClick={openWhatsApp}
                disabled={isLoading || !message.trim()}
                className="
                  w-full py-3 px-4 rounded-xl font-semibold text-sm
                  bg-green-500 text-white
                  hover:bg-green-600 active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                  flex items-center justify-center gap-2
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening WhatsApp...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Continue to WhatsApp
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                You&apos;ll be redirected to WhatsApp with your message pre-filled
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}