"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: <CheckCircle className="w-5 h-5 text-green-400" />,
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: <AlertCircle className="w-5 h-5 text-red-400" />,
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: <Info className="w-5 h-5 text-blue-400" />,
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const style = toastStyles[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${style.bg} ${style.border} shadow-lg backdrop-blur-sm animate-slide-in`}
    >
      {style.icon}
      <p className="text-white text-sm flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );

  const showError = useCallback(
    (message: string) => showToast(message, "error", 6000),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string) => showToast(message, "info"),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string) => showToast(message, "warning", 5000),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showInfo, showWarning, dismissToast }}
    >
      {children}

      {/* Toast Container - Fixed position at top right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
