"use client";

import { useState, useEffect } from "react";
import { flushSync } from 'react-dom';
import { useUnifiedTest } from "@/lib/unified-test-context";
import { useTestResults } from "@/lib/test-results-context";
import { getBackendUrl } from "@/lib/api-url";
import { Layers, Play, Clock, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false }) as any;

interface CacheResult {
  key: string;
  cached: boolean;
  duration: number;
}

export default function CacheTestsPage() {
  const { intervalMs } = useUnifiedTest();
  const { publishCacheResults } = useTestResults();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CacheResult[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [config, setConfig] = useState({
    keysCount: 8,
    hitProbability: 0.65,
  });

  const [totalTime, setTotalTime] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runBenchmark = async () => {
    setRunning(true);
    setResults([]);
    setHits(0);
    setMisses(0);
    let h = 0, m = 0;
    const start = Date.now();

    const currentCacheKeys = Array.from({ length: config.keysCount }, (_, i) => `key:${i}`);
    const BACKEND_URL = getBackendUrl();

    for (const key of currentCacheKeys) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/cache/check?key=${key}&probability=${config.hitProbability}`);
        if (!response.ok) continue;
        const { cached, duration } = await response.json();
        
        await new Promise((r) => setTimeout(r, (intervalMs || 1000) * 0.1));
        
        if (cached) h++; else m++;

        flushSync(() => {
          setHits(h);
          setMisses(m);
          setResults((prev) => [...prev, { key, cached, duration }]);
        });
      } catch (err) {
        console.error("Cache check error:", err);
      }
    }
    
    setTotalTime(Date.now() - start);
    const localHitRate = h + m > 0 ? Math.round((h / (h + m)) * 100) : 0;
    publishCacheResults({ hits: h, misses: m, hitRate: localHitRate });
    setRunning(false);
  };

  const invalidateCache = async (key: string) => {
    const BACKEND_URL = getBackendUrl();
    try {
      await fetch(`${BACKEND_URL}/api/cache/invalidate/${key}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Cache invalidate error:", err);
    }
    setResults(prev => prev.filter(r => r.key !== key));
    // Update hits/misses count based on removal
    const removed = results.find(r => r.key === key);
    if (removed) {
        if (removed.cached) setHits(prev => prev - 1);
        else setMisses(prev => prev - 1);
    }
  };

  const hitRate = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;
  const throughput = totalTime > 0 ? ((hits + misses) / (totalTime / 1000)).toFixed(2) : "0.00";

  const chartOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    stroke: { curve: "smooth", width: 2 },
    colors: ["#10b981", "#f59e0b"],
    labels: ["Cache Hit", "Cache Miss"],
    dataLabels: { enabled: false },
    legend: { position: "bottom", labels: { colors: ["#94a3b8"] } },
    responsive: [{ breakpoint: 480, options: { legend: { position: "bottom" } } }],
  };

  return (
    <div className="mx-auto space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Pruebas de Caché</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Evalúa el rendimiento del sistema de caché y tasa de aciertos
              </p>
            </div>
          </div>
          <button
            onClick={runBenchmark}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:bg-sky-600 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {running ? "Ejecutando..." : "Ejecutar benchmark"}
          </button>
        </div>
      </div>

      {/* Configuración */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Conexión y Parámetros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Claves a probar</label>
              <input type="number" value={config.keysCount} onChange={(e) => setConfig({...config, keysCount: parseInt(e.target.value) || 0})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Probabilidad de Hit (0-1)</label>
              <input type="number" step="0.1" value={config.hitProbability} onChange={(e) => setConfig({...config, hitProbability: parseFloat(e.target.value) || 0})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Cache Hits", value: hits.toString(), icon: Zap, color: "text-emerald-500" },
          { label: "Cache Misses", value: misses.toString(), icon: AlertTriangle, color: "text-amber-500" },
          { label: "Hit Rate", value: results.length ? `${hitRate}%` : "--", icon: TrendingUp, color: "text-sky-500" },
          { label: "Throughput (keys/s)", value: throughput, icon: Clock, color: "text-purple-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg text-slate-500 dark:text-slate-400">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Distribución Hits / Misses</h2>
          <div className="h-64">
            {mounted ? (
                <Chart options={chartOptions} series={[hits, misses]} type="donut" height={256} />
            ) : (
                <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-900/50" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-3xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/85">
              <p className="text-lg text-slate-400 dark:text-slate-500">Ejecuta el benchmark para ver resultados...</p>
            </div>
          ) : (
            results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${r.cached ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                  {r.cached ? "H" : "M"}
                </div>
                <p className="min-w-0 flex-1 truncate font-mono text-lg text-slate-700 dark:text-slate-300">{r.key}</p>
                <button 
                  onClick={() => invalidateCache(r.key)}
                  className="shrink-0 rounded-lg bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/20"
                >
                  Invalidar
                </button>
                <span className={`shrink-0 text-lg font-semibold ${r.cached ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {r.duration}ms
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
