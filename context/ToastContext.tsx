import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast } from '../components/Toast';

export type ToastTone = 'success' | 'info' | 'error';

export type ToastOptions = {
  duration?: number;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastItem = {
  id: number;
  message: string;
  duration: number;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastArg = number | ToastOptions;

interface ToastContextType {
  showToast: (message: string, durationOrOptions?: ToastArg) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, durationOrOptions?: ToastArg) => {
    const id = Date.now();
    const opts: ToastOptions =
      typeof durationOrOptions === 'number'
        ? { duration: durationOrOptions }
        : (durationOrOptions ?? {});
    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        duration: opts.duration ?? 3000,
        tone: opts.tone ?? 'success',
        actionLabel: opts.actionLabel,
        onAction: opts.onAction,
      },
    ]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          duration={toast.duration}
          tone={toast.tone}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
