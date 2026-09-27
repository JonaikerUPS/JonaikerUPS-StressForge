"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ErrorBoundary caught:", error);
    if (error?.message?.includes("Failed to load chunk") || error?.message?.includes("ChunkLoadError")) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6 shadow-xl">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-black mb-2">Error del Sistema</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-md font-mono bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
        {error?.message || "Algo salió mal inesperadamente en la interfaz."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 rounded-xl font-bold transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
        >
          <RotateCcw className="h-4 w-4" /> Intentar de nuevo
        </button>
        <Link
          href="/home"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all hover:opacity-90"
        >
          <Home className="h-4 w-4" /> Volver al Inicio (/home)
        </Link>
      </div>
    </div>
  );
}
