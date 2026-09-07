"use client";

import { useState, useEffect } from "react";
import { useUnifiedTest } from "@/lib/unified-test-context";
import { useTestResults } from "@/lib/test-results-context";
import { FileUp, Play, HardDrive, Upload, Gauge } from "lucide-react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false }) as any;
import { type ApexOptions } from "apexcharts";

interface FileResult {
  name: string;
  size: string;
  duration: number;
  speed: number;
}

export default function FilesTestsPage() {
  const { intervalMs } = useUnifiedTest();

  const { publishFileResults } = useTestResults();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const files = [
    { name: "avatar-512px.webp", sizeMB: 0.5 },
    { name: "reporte-2025.pdf", sizeMB: 2.4 },
    { name: "fondo-hd.jpg", sizeMB: 4.8 },
    { name: "video-presentacion.mp4", sizeMB: 25 },
    { name: "backup-datos.sql", sizeMB: 64 },
    { name: "log-sistema.txt", sizeMB: 0.05 },
  ];

  const runTest = async () => {
    setRunning(true);
    setResults([]);
    setTotalSize(0);
    setTotalTime(0);
    let accumSize = 0;
    let accumTime = 0;

    const localResults: FileResult[] = [];

    for (const f of files) {
      const duration = intervalMs * (0.3 + f.sizeMB / 64 * 0.7);
      const sizeBytes = f.sizeMB * 1024;
      const speed = sizeBytes / (duration / 1000);
      await new Promise((r) => setTimeout(r, duration));
      accumSize += f.sizeMB;
      accumTime += duration;
      setTotalSize(accumSize);
      setTotalTime(Math.round(accumTime));
      
      const newResult: FileResult = {
        name: f.name,
        size: f.sizeMB >= 1 ? `${f.sizeMB} MB` : `${Math.round(f.sizeMB * 1024)} KB`,
        duration: Math.round(duration),
        speed: Math.round(speed),
      };
      localResults.push(newResult);
      setResults([...localResults]);
    }
    const localAvgSpeed = localResults.length ? Math.round(localResults.reduce((a, r) => a + r.speed, 0) / localResults.length) : 0;
    publishFileResults({ totalTransfers: localResults.length, avgSpeed: localAvgSpeed, totalSize: Math.round(accumSize * 1024 * 1024) });
    setRunning(false);
  };

  const avgSpeed = results.length ? Math.round(results.reduce((a, r) => a + r.speed, 0) / results.length) : 0;

  const chartSeries = [{ name: "Velocidad (KB/s)", data: results.map((r) => r.speed) }];
  const chartOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, horizontal: true } },
    stroke: { width: 0 },
    colors: ["#38bdf8"],
    xaxis: { labels: { style: { colors: ["#94a3b8"] } } },
    yaxis: { labels: { style: { colors: ["#94a3b8"] }, maxWidth: 200 } },
    grid: { strokeDashArray: 4, borderColor: "rgba(148,163,184,0.12)" },
  };

  return (
    <div className="mx-auto space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Pruebas de Archivos</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Evalúa velocidad de transferencia y throughput de archivos
              </p>
            </div>
          </div>
          <button
            onClick={runTest}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:bg-sky-600 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {running ? "Transfiriendo..." : "Iniciar prueba"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Archivos procesados", value: results.length.toString(), icon: HardDrive, color: "text-sky-500" },
          { label: "Volumen total", value: totalSize ? `${totalSize.toFixed(1)} MB` : "--", icon: Upload, color: "text-emerald-500" },
          { label: "Velocidad promedio", value: avgSpeed ? `${avgSpeed} KB/s` : "--", icon: Gauge, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Velocidad por archivo</h2>
          <div className="h-72">
            {mounted ? (
                <Chart options={chartOptions} series={chartSeries} type="bar" height={288} />
            ) : (
                <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-900/50" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-3xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/85">
              <p className="text-lg text-slate-400 dark:text-slate-500">Inicia una prueba para ver resultados...</p>
            </div>
          ) : (
            results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-medium text-slate-700 dark:text-slate-300">{r.name}</p>
                  <p className="text-[14px] text-slate-400">{r.size}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold text-slate-950 dark:text-white">{r.speed} KB/s</p>
                  <p className="text-[15px] text-slate-400">{r.duration}ms</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
