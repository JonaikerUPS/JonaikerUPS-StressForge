"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Error del Sistema</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">Algo salió mal. Nuestro equipo técnico ha sido notificado.</p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all hover:opacity-90"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
