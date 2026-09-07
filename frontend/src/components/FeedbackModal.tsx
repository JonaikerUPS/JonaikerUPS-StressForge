"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error" | "loading";
}

export function FeedbackModal({ isOpen, onClose, title, message, type }: FeedbackModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          // Removed onClick={onClose} to prevent closing on outside click
        >
          <motion.div
            initial={{ scale: 0.9, rotateX: -20, opacity: 0 }}
            animate={{ scale: 1, rotateX: 0, opacity: 1 }}
            exit={{ scale: 0.9, rotateX: 20, opacity: 0 }}
            className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
            style={{ perspective: 1000 }}
          >
            <div className="flex flex-col items-center gap-6">
              {type === "loading" ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-sky-500"
                />
              ) : (
                <motion.div
                  initial={{ scale: 0, rotateY: -90 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg ${
                    type === "success"
                      ? "bg-emerald-500 shadow-emerald-500/25"
                      : "bg-red-500 shadow-red-500/25"
                  }`}
                >
                  {type === "success" ? (
                    <Check className="h-8 w-8 text-white" />
                  ) : (
                    <X className="h-8 w-8 text-white" />
                  )}
                </motion.div>
              )}

              <div className="text-center w-full">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-slate-500 dark:text-slate-400">{message}</p>
                
                {type === "loading" && (
                  <div className="mt-6 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-sky-500"
                      initial={{ width: "20%" }}
                      animate={{ width: "100%" }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className={`rounded-xl px-6 py-2 text-sm font-semibold transition-all ${
                  type === "loading" 
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700" 
                    : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                }`}
              >
                {type === "loading" ? "Cerrar y ver vista" : "Cerrar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
