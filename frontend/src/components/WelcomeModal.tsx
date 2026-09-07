"use client";

import { Zap, AlertTriangle } from "lucide-react";
import { getBackendUrl } from "@/lib/api-url";

export function WelcomeModal({ 
    isOpen, 
    onContinue, 
    onNewTest, 
    title = "Bienvenido a StressForge", 
    message = "Hemos detectado actividad previa en tu cuenta. ¿Cómo deseas proceder?" 
}: { 
    isOpen: boolean; 
    onContinue: () => void; 
    onNewTest: () => void; 
    title?: string; 
    message?: string;
}) {
  if (!isOpen) return null;

  const handleNewTest = async () => {
    const auth = typeof window !== 'undefined' ? localStorage.getItem("admin-auth") : null;
    if (auth) {
        try {
          const { token } = JSON.parse(auth);
          await fetch(`${getBackendUrl()}/api/tests/clear`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch {}
    }
    onNewTest();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-3 text-sky-400">
            <Zap className="h-8 w-8" />
            <h2 className="text-2xl font-bold text-white">{title}</h2>
        </div>
                
        <p className="text-slate-300">
            {message}
        </p>
        <div className="grid grid-cols-1 gap-4">
            <button
                onClick={onContinue}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition"
            >
                {message.includes("previa") ? "Retomar mis pruebas anteriores" : "Comenzar"}
            </button>
            <button
                onClick={handleNewTest}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
            >
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Realizar nuevas pruebas (Limpiar todo)
            </button>
        </div>
      </div>
    </div>
  );
}
