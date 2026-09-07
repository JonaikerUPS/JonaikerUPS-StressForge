"use client";

import { useState, useEffect } from "react";
import { useUnifiedTest } from "@/lib/unified-test-context";
import { useTestResults } from "@/lib/test-results-context";
import { useSocket } from "@/lib/socket-context";
import { Database, Play, BarChart3, Clock, HardDrive, Download, Plus, Trash2 } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false }) as any;
import { type ApexOptions } from "apexcharts";

interface QueryResult {
  query: string;
  duration: number;
  rows: number;
  latency: number;
  status: 'success' | 'error';
}

interface DbConfig {
  tool: 'k6' | 'locust' | 'taurus' | 'hey' | 'bombardier' | 'vegeta' | 'simulacion';
  provider: 'mongo' | 'postgres';
  host: string;
  user: string;
  pass: string;
  users: number;
  requests: number;
}

export default function DatabaseTestsPage() {
  const { intervalMs } = useUnifiedTest();

  const { publishDbResults } = useTestResults();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [newQuery, setNewQuery] = useState("");
  const [queries, setQueries] = useState<string[]>([
    "SELECT * FROM users WHERE status = 'active'",
    "SELECT COUNT(*) FROM orders GROUP BY date",
  ]);
  const [config, setConfig] = useState<DbConfig>({ 
    tool: 'simulacion',
    provider: 'postgres', 
    host: 'localhost', 
    user: 'admin', 
    pass: '****', 
    users: 10, 
    requests: 100 
  });


  const addQuery = () => {
    if (newQuery.trim()) {
        setQueries([...queries, newQuery.trim()]);
        setNewQuery("");
    }
  };

  const removeQuery = (index: number) => {
    setQueries(queries.filter((_, i) => i !== index));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const socket = useSocket();

  const runBenchmark = async () => {
    if (!socket) return;
    setRunning(true);
    setResults([]);
    setTotalTime(0);

    let token: string | undefined;
    let userId: string | undefined;
    try {
      const auth = typeof window !== 'undefined' ? localStorage.getItem('admin-auth') : null;
      if (auth) {
        const parsed = JSON.parse(auth);
        token = parsed.token;
        userId = parsed.userId || parsed.user?.id || parsed.id;
      }
    } catch {}

    socket.emit("start-test", { ...config, category: 'database', userId, token, queries });

    socket.once("test-data", (data: any) => {
        if (data.type === 'complete') {
            const queryResults = data.results || [];
            setResults(queryResults);
            setRunning(false);
            
            if (queryResults.length > 0) {
              const avgDuration = Math.round(queryResults.reduce((sum: number, r: any) => sum + r.duration, 0) / queryResults.length);
              const durationHistory = queryResults.map((r: any) => r.duration);
              publishDbResults({
                queryCount: queryResults.length,
                avgDuration,
                durationHistory
              });
            }
        }
    });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const primaryColor = [15, 23, 42];
    
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Reporte Benchmark DB", 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 30);

    // Tabla de resultados
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Detalle de Consultas", 14, 55);
    
    autoTable(doc, {
        startY: 60,
        head: [['Consulta', 'Duración (ms)', 'Filas']],
        body: results.map(r => [r.query, r.duration.toString(), r.rows.toLocaleString()]),
        theme: 'striped',
        headStyles: { fillColor: primaryColor as any }
    });

    doc.save(`reporte_db_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const chartOptions: ApexOptions = {
    chart: { toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, horizontal: true } },
    stroke: { width: 0 },
    colors: ["#38bdf8"],
    xaxis: {
      labels: { style: { colors: ["#94a3b8"] } },
    },
    yaxis: {
      labels: { style: { colors: ["#94a3b8"] }, maxWidth: 300 },
    },
    grid: { strokeDashArray: 4, borderColor: "rgba(148,163,184,0.12)" },
  };

  const chartSeries = [
    {
      name: "Duración (ms)",
      data: results.map((r) => r.duration),
    },
  ];

  return (
    <div className="mx-auto space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                Pruebas de Base de Datos
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Evalúa el rendimiento de consultas y operaciones CRUD
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runBenchmark}
              disabled={running || queries.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:bg-sky-600 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {running ? "Ejecutando..." : "Ejecutar benchmark"}
            </button>
            <button
              onClick={downloadPDF}
              disabled={results.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Configuración de Conexión y Carga */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Conexión y Parámetros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Herramienta</label>
              <select value={config.tool} onChange={(e) => setConfig({...config, tool: e.target.value as any})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                  <option value="simulacion">Simulación</option>
                  <option value="k6">k6</option>
                  <option value="locust">Locust</option>
                  <option value="taurus">Taurus</option>
                  <option value="hey">Hey</option>
                  <option value="bombardier">Bombardier</option>
                  <option value="vegeta">Vegeta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Provider</label>
              <select value={config.provider} onChange={(e) => setConfig({...config, provider: e.target.value as any})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">
                  <option value="postgres">Postgres</option>
                  <option value="mongo">Mongo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Host</label>
              <input value={config.host} onChange={(e) => setConfig({...config, host: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Usuario</label>
              <input value={config.user} onChange={(e) => setConfig({...config, user: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label>
              <input type="password" value={config.pass} onChange={(e) => setConfig({...config, pass: e.target.value})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Usuarios</label>
              <input type="number" value={config.users} onChange={(e) => setConfig({...config, users: parseInt(e.target.value) || 0})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Peticiones</label>
              <input type="number" value={config.requests} onChange={(e) => setConfig({...config, requests: parseInt(e.target.value) || 0})} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
        </div>
      </div>

      {/* Editor de Consultas */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Configuración de Consultas</h2>
        <div className="flex gap-2 mb-4">
            <input 
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                placeholder="Escribe una consulta SQL..."
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <button onClick={addQuery} className="p-3 bg-sky-500 text-white rounded-2xl hover:bg-sky-600">
                <Plus className="h-4 w-4" />
            </button>
        </div>
        <div className="space-y-2">
            {queries.map((q, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{q}</span>
                    <button onClick={() => removeQuery(i)} className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid gap-4 sm:grid-cols-3">

        {[
          { label: "Consultas ejecutadas", value: results.length.toString(), icon: BarChart3 },
          { label: "Tiempo total", value: totalTime ? `${totalTime}ms` : "--", icon: Clock },
          { label: "Filas procesadas", value: results.reduce((a, r) => a + r.rows, 0).toLocaleString(), icon: HardDrive },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className="text-lg font-semibold text-slate-950 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
          Duración por consulta
        </h2>
        <div className="h-[450px] w-full overflow-hidden pl-4 pr-2">
            {mounted ? (
                <Chart options={chartOptions} series={chartSeries} type="bar" width="100%" height={430} />
            ) : (
                <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-900/50" />
            )}
        </div>
      </div>

      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/85">
            <p className="text-lg text-slate-400 dark:text-slate-500">
              Ejecuta el benchmark para ver resultados...
            </p>
          </div>
        ) : (
          results.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/85"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-slate-700 dark:text-slate-300">
                  {r.query}
                </p>
                <div className="mt-1 flex gap-3 text-xs text-slate-400">
                    <span>{r.rows.toLocaleString()} filas</span>
                    <span>Latencia: {r.latency}ms</span>
                    <span className={r.status === 'success' ? 'text-emerald-500' : 'text-red-500'}>{r.status}</span>
                </div>
              </div>
              <div
                className={`shrink-0 text-sm font-semibold ${
                  r.duration < 150
                    ? "text-emerald-600 dark:text-emerald-400"
                    : r.duration < 300
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {r.duration}ms
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
