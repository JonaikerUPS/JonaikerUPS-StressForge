"use client";

import { X, AlertTriangle } from "lucide-react";

interface GlobalErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const GlobalErrorModal = ({ isOpen, onClose, title, message }: GlobalErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">{message}</p>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold hover:opacity-90">
                Entendido
            </button>
        </div>
      </div>
    </div>
  );
};
