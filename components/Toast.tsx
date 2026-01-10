import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'info' | 'error';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000, tone = 'success', actionLabel, onAction }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = tone === 'error' ? AlertCircle : tone === 'info' ? Info : CheckCircle2;
  const iconBg = tone === 'error' ? 'bg-red-500/15' : tone === 'info' ? 'bg-white/10' : 'bg-[#dfcda5]/20';
  const iconColor = tone === 'error' ? 'text-red-300' : tone === 'info' ? 'text-zinc-100' : 'text-[#dfcda5]';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
      <div className="bg-zinc-900/95 border border-[#dfcda5] rounded-xl p-4 backdrop-blur-lg shadow-2xl shadow-black/50 flex items-center gap-3 min-w-[280px] max-w-md animate-bounce-subtle admin-toast">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor} animate-scale-in`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{message}</p>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={() => {
                onAction();
                onClose();
              }}
              className="mt-1 text-xs font-semibold text-[#dfcda5] hover:underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
