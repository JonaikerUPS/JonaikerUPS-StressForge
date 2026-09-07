"use client";

import { useState, useEffect } from "react";
import { useUnifiedTest } from "@/lib/unified-test-context";
import { useTestResults } from "@/lib/test-results-context";
import { getBackendUrl } from "@/lib/api-url";
import { Network, Play, Clock, Activity, Wifi, WifiOff, Plus, Trash2, Search } from "lucide-react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false }) as any;

interface ServerResult {
  server: string;
  latency: number;
  packetLoss: number;
  jitter: number;
  status: "success" | "warning" | "error";
}

export default function NetworkTestsPage() {
  const { publishNetworkResults } = useTestResults();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ServerResult[]>([]);
  const [scanResults, setScanResults] = useState<string>("");
  const [target, setTarget] = useState("google.com");
  const [customServers, setCustomServers] = useState<string[]>(["google.com", "github.com", "8.8.8.8"]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const runTest = async () => {
    setRunning(true);
    setResults([]);
    const BACKEND_URL = getBackendUrl();
    const localResults: ServerResult[] = [];

    for (const server of customServers) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/network/ping?target=${server}`);
        const data = await response.json();
        localResults.push(data);
        setResults([...localResults]);
      } catch (e) {
        console.error("Ping error", e);
      }
    }

    if (localResults.length > 0) {
      const avgLatency = Math.round(localResults.reduce((sum, r) => sum + r.latency, 0) / localResults.length);
      const avgPacketLoss = Math.round(localResults.reduce((sum, r) => sum + r.packetLoss, 0) / localResults.length);
      const latencyHistory = localResults.map(r => r.latency);
      publishNetworkResults({ avgLatency, packetLoss: avgPacketLoss, latencyHistory });
    }
    setRunning(false);
  };

  const runScan = async () => {
    setRunning(true);
    setScanResults("Escaneando...");
    const BACKEND_URL = getBackendUrl();
    try {
        let token: string | undefined;
        try {
          const auth = typeof window !== 'undefined' ? localStorage.getItem('admin-auth') : null;
          if (auth) token = JSON.parse(auth)?.token;
        } catch {}

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${BACKEND_URL}/api/network/scan-ports?target=${target}`, { headers });
        const data = await response.json();
        setScanResults(data.results || "Sin resultados.");
    } catch (e) {
        setScanResults("Error al escanear.");
    }
    setRunning(false);
  };

  const chartSeries = [
    { name: "Latencia (ms)", data: results.map(r => r.latency) },
    { name: "Jitter (ms)", data: results.map(r => r.jitter) }
  ];

  const chartOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
    xaxis: { categories: results.map(r => r.server) },
    colors: ["#38bdf8", "#fbbf24"],
    grid: { strokeDashArray: 4, borderColor: "rgba(148,163,184,0.12)" },
  };

  return (
    <div className="mx-auto space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Pruebas de Red Avanzadas</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <input 
                value={target} 
                onChange={(e) => setTarget(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                placeholder="Añadir servidor (ej. 1.1.1.1)"
            />
            <button onClick={() => setCustomServers([...customServers, target])} className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200">
                <Plus className="h-4 w-4" />
            </button>
            <button
                onClick={runTest}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
                <Play className="h-4 w-4" />
                {running ? "Probando..." : "Ejecutar Diagnóstico"}
            </button>
            <button
                onClick={runScan}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
                <Search className="h-4 w-4" />
                {running ? "Escaneando..." : "Escanear Puertos"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Métricas de Latencia y Jitter</h2>
          {mounted ? (
              <Chart options={chartOptions} series={chartSeries} type="bar" height={350} />
          ) : <div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl" />}
        </div>
        
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Resultados de Escaneo (Nmap)</h2>
          <pre className="h-64 overflow-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-emerald-400">
              {scanResults}
          </pre>
        </div>

        <div className="space-y-3 lg:col-span-2">
          {results.map((r) => (
            <div key={r.server} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <div className="flex items-center gap-3">
                {r.packetLoss === 0 ? <Wifi className="text-emerald-500" /> : <WifiOff className="text-red-500" />}
                <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{r.server}</span>
              </div>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-400">Lat: {r.latency}ms</span>
                <span className="text-amber-600 dark:text-amber-400">Jit: {r.jitter}ms</span>
                <span className={r.packetLoss > 0 ? "text-red-500" : "text-emerald-500"}>Loss: {r.packetLoss}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
