import React, { useState } from 'react';
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useTestConfig } from "@/lib/test-config-context";
import { useSocket } from "@/lib/socket-context";
import { useTestResults } from "@/lib/test-results-context";

interface TestTriggerButtonProps {
  tool: string;
  isUp: boolean;
}

export function TestTriggerButton({ tool, isUp }: TestTriggerButtonProps) {
  const [loading, setLoading] = useState(false);
  const { setActiveLogs } = useTestResults();
  const socket = useSocket();

  const runTest = () => {
    if (!socket || !isUp) return;
    setLoading(true);
    setActiveLogs(tool, "Iniciando prueba...\n");
    socket.emit("start-test", {
      tool: tool,
      type: "load",
      durationMs: 10000,
      concurrency: 5,
      targetUrl: "http://localhost:8080/api/tests"
    });
    
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
        {/* Trigger Button */}
        <button
            onClick={runTest}
            disabled={loading || !socket || !isUp}
            className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
                loading ? "animate-pulse" : ""
            } ${!isUp ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            <span>{loading ? "Ejecutando..." : "Ejecutar Prueba"}</span>
        </button>
    </div>
  );
}
