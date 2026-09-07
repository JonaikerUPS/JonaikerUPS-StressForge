"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">404 - Página no encontrada</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">La página que buscas no existe o ha sido movida.</p>
      <Link href="/dashboard" className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition-all">
        Volver al Dashboard
      </Link>
    </div>
  );
}
