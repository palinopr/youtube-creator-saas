"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, RefreshCw } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onRetry?: () => void;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration (default 5s for errors, 3s for others)
    const duration = toast.duration ?? (toast.type === "error" ? 5000 : 3000);
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const bgColors = {
    success: "bg-green-500/10 border-green-500/30",
    error: "bg-red-500/10 border-red-500/30",
    warning: "bg-yellow-500/10 border-yellow-500/30",
    info: "bg-blue-500/10 border-blue-500/30",
  };

  return (
    <div
      className={`
        ${bgColors[toast.type]}
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        transform transition-all duration-200
        ${isExiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}
        animate-in slide-in-from-right-4
      `}
    >
      <div className="flex items-start gap-3">
        {icons[toast.type]}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-gray-400 mt-1">{toast.message}</p>
          )}
          {toast.onRetry && (
            <button
              onClick={toast.onRetry}
              className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Simple inline toast for quick use without context
export function InlineToast({
  type,
  title,
  message,
  onRetry,
  onDismiss,
}: {
  type: ToastType;
  title: string;
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const bgColors = {
    success: "bg-green-500/10 border-green-500/30",
    error: "bg-red-500/10 border-red-500/30",
    warning: "bg-yellow-500/10 border-yellow-500/30",
    info: "bg-blue-500/10 border-blue-500/30",
  };

  return (
    <div className={`${bgColors[type]} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">{title}</p>
          {message && (
            <p className="text-xs text-gray-400 mt-1">{message}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
