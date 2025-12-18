import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
      <div className="bg-zinc-900/95 border border-[#dfcda5] rounded-xl p-4 backdrop-blur-lg shadow-2xl shadow-black/50 flex items-center gap-3 min-w-[280px] max-w-md animate-bounce-subtle">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#dfcda5]/20 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-[#dfcda5] animate-scale-in" />
        </div>
        <p className="flex-1 text-white text-sm font-medium">{message}</p>
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
