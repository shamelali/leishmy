"use client";
import { useState, useCallback } from "react";
interface Toast { id: string; message: string; type: "success" | "error" | "info" | "warning"; duration?: number; }
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id, duration: toast.duration || 5000 };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, newToast.duration);
  }, []);
  const removeToast = useCallback((id: string) => { setToasts(prev => prev.filter(t => t.id !== id)); }, []);
  return { toasts, addToast, removeToast };
}
