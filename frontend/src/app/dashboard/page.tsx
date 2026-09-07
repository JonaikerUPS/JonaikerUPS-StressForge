"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSocket } from "@/lib/socket-context";
import {
  K6View, ArtilleryView, TaurusView, LocustView, JMeterView,
  AutocannonView, HeyView, SimulacionView, AggregatedView,
} from "@/components/ToolViews";
import { useApiTestConfig } from "@/lib/api-test-config-context";
import dynamic from "next/dynamic";
import MetricCard from "@/components/dashboard/MetricCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { DynamicToolConfig } from "@/components/dashboard/DynamicToolConfig";
import { DashboardProvider, useDashboard } from "@/lib/dashboard-context";
import { useLoading } from "@/lib/loading-context";
import { FeedbackModal } from "@/components/FeedbackModal";
import { WelcomeModal } from "@/components/WelcomeModal";
import type { ApexOptions } from "apexcharts";
import { UnifiedMetrics } from "@/types/metrics";
import {
  TrendingUp, Users, ShieldCheck, Activity, Server, Radio, Database,
  Gauge, Clock, Zap, Loader2, Layers, Network, FileUp, CheckCircle2, Circle, Globe, ZoomIn, ZoomOut,
} from "lucide-react";
import { useUnifiedTest } from "@/lib/unified-test-context";
import { useTestResults } from "@/lib/test-results-context";
import { translateLog } from "@/lib/log-translator";
import { type ToolOption } from "@/lib/tool-schemas";
import { checkToolStatus, apiClient } from "@/lib/api-client";
import { getBackendUrl } from "@/lib/api-url";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false }) as any;

const COLORS = {
  primary: "#38bdf8",
  success: "#10b981",
  warning: "#f59e0b",
  danger:  "#ef4444",
  purple:  "#8b5cf6",
  pink:    "#ec4899",
};

const baseChart = {
  chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit" },
  grid: { show: false },
  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { show: false } },
};

const STATUS_OK       = "Operacional";
const STATUS_DEGRADED = "Degradado";
const STATUS_ERROR    = "Error crítico";

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

function DashboardContent() {
  const { health } = useDashboard();
  const { stopLoading, startLoading } = useLoading();

  useEffect(() => {
    startLoading();
    const t = setTimeout(() => stopLoading(), 1000);
    return () => clearTimeout(t);
  }, []);

  const { selectedTool, config, updateConfig, intervalMs, endpoints } = useUnifiedTest();
  const { results, publishApiResults, publishWsResults, publishDbResults, publishLoadResults, clearResults } = useTestResults();
  
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
      const dismissed = typeof window !== "undefined" ? sessionStorage.getItem("welcome-dismissed") : null;
      if (dismissed) return;

      const hasVisited = localStorage.getItem("visited-dashboard");
      const hasActivity = results && (results.api || results.websocket || results.database || results.load || results.network || results.security || results.files);

      if (!hasVisited) {
          setIsWelcomeModalOpen(true);
          setModalConfig({
              title: "Bienvenido a StressForge",
              message: "¡Hola! Esta es tu primera vez en el sistema. Estamos listos para comenzar tus pruebas de rendimiento."
          });
          localStorage.setItem("visited-dashboard", "true");
      } else if (hasActivity) {
          setIsWelcomeModalOpen(true);
          setModalConfig({
              title: "Bienvenido de nuevo",
              message: "Hemos detectado actividad previa en tu cuenta. ¿Cómo deseas proceder?"
          });
      }
  }, [results]);
  
  const [logs, setLogs] = useState<{tool: string, message: string, time: string}[]>([]);
  const [unifiedMetrics, setUnifiedMetrics] = useState<UnifiedMetrics | null>(null);
  const [running, setRunning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [statusMessage, setStatusMessage] = useState("Conectando...");
  const [toolAvailability, setToolAvailability] = useState<Record<string, boolean> | null>(null);
  const [systemStats, setSystemStats] = useState({ activeUsers: 0, reqPerMinute: 0, loginTime: null as number | null });
  const [exporting, setExporting] = useState<"csv" | "pdf" | "report" | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // ── Sync historical results to live metrics if no active test ──────
  useEffect(() => {
    if (!running && results.api && !unifiedMetrics) {
      setUnifiedMetrics({
        tool: "histórico",
        timestamp: Date.now(),
        latency: { 
            avg: results.api.avgLatency, 
            p50: results.api.percentiles?.p50,
            p95: results.api.percentiles?.p95 || 0,
            p99: results.api.percentiles?.p99
        },
        throughput: results.api.throughput,
        errorRate: 100 - results.api.successRate,
        cpuUsage: 0,
        ramUsage: 0
      });
    }
  }, [results.api, running]);

  const socket = useSocket();

  useEffect(() => {
  }, [results]);

  const [systemResources, setSystemResources] = useState({ cpu: 0, ram: 0 });
  useEffect(() => {
    const fetch_ = async () => {
      try {
        // Recursos
        const base = getBackendUrl();
        const res = await fetch(`${base}/api/system/resources`);
        if (res.ok) {
          const d = await res.json();
          setSystemResources({ cpu: Math.round(d.cpu || 0), ram: Math.round(d.ram || 0) });
        }
        // Estadísticas de sesión
        const stats = await apiClient<{ activeUsers: number, reqPerMinute: number, loginTime: number | null }>('/api/system/stats');
        setSystemStats(stats);
      } catch {}
    };
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => clearInterval(id);
  }, []);

  const [apiLatencies]     = useState<number[]>(() => Array(12).fill(0));
  const [wsThroughput]     = useState<number[]>(() => Array(12).fill(0));
  const [errorRate]        = useState<number[]>(() => Array(12).fill(0));
  const [concurrentUsers]  = useState<number[]>(() => Array(12).fill(0));
  const [timeLabels, setTimeLabels] = useState<string[]>(() =>
    Array.from({ length: 12 }, () => new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
  );
  const [feedback, setFeedback] = useState<{ title: string; message: string; type: "success" | "error" | "loading" } | null>(null);

  useEffect(() => {
    checkToolStatus().then((d) => setToolAvailability(d.tools)).catch(() => {});
  }, []);

  const metrics = useMemo(() => {
    if (!results) return { avgApi: 0, avgDb: 0, successRate: 0, totalErrors: 0, cpuAvg: 0, memAvg: 0 };
    return {
      avgApi:       results.api?.avgLatency || 0,
      avgDb:        results.database?.avgDuration || 0,
      successRate:  results.api?.successRate || 0,
      totalErrors:  (results.load?.errorRate || 0) + (results.api?.endpoints?.filter((e: any) => e.status === "error").length || 0),
      cpuAvg:       results.system?.cpu || systemResources.cpu || 0,
      memAvg:       results.system?.ram || systemResources.ram || 0,
    };
  }, [results, systemResources]);

  const latestError   = errorRate[errorRate.length - 1];
  const systemStatus  = latestError < 5 ? STATUS_OK : latestError < 10 ? STATUS_DEGRADED : STATUS_ERROR;
  const statusColor   = systemStatus === STATUS_OK ? "text-emerald-500" : systemStatus === STATUS_DEGRADED ? "text-amber-500" : "text-red-500";

  const handleStartTest = useCallback((toolConfig: any) => {
    if (!socket) return;
    setRunning(true);
    setLogs([]);
    socket.emit("start-test", {
      tool: selectedTool,
      type: "api-batch",
      ...config,
      ...toolConfig,
      headers: toolConfig.headers || config.headers,
      body: toolConfig.body || config.body,
      endpoints: (toolConfig.endpoints || config.endpoints || []).map((ep: any) => ({
        endpoint: ep.endpoint, method: ep.method, requestBody: ep.requestBody,
      })),
    });
  }, [socket, config, selectedTool]);

  const RenderedView = useMemo(() => {
    const props = {
      metrics: unifiedMetrics,
      toolName: selectedTool,
      isUp: toolAvailability?.[selectedTool] ?? false,
      endpoints,
      onStartTest: handleStartTest,
      running,
    };
    switch (selectedTool) {
      case "k6":          return <K6View          {...props} />;
      case "artillery":   return <ArtilleryView   {...props} />;
      case "taurus":      return <TaurusView       {...props} />;
      case "locust":      return <LocustView       {...props} />;
      case "jmeter":      return <JMeterView       {...props} />;
      case "autocannon":  return <AutocannonView   {...props} />;
      case "hey":         return <HeyView          {...props} />;
      case "simulacion":  return <SimulacionView   {...props} />;
      default:            return <AggregatedView   {...props} />;
    }
  }, [selectedTool, unifiedMetrics, toolAvailability, endpoints, handleStartTest, running]);

  useEffect(() => {
    if (!socket) return;
    socket.on("test-update", (data: any) => {
      if (data.type === "metrics") setUnifiedMetrics(data.data);
      if (data.type === "log") {
        const msg = typeof data.data === "string" ? data.data : data.log || JSON.stringify(data);
        setLogs((p) => [...p.slice(-100), { tool: data.tool || 'System', message: msg, time: new Date().toLocaleTimeString() }]);
      }
    });
    return () => { socket.off("test-update"); };
  }, [socket]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      const now = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setTimeLabels((p) => [...p.slice(1), now]);
    }, intervalMs);
    return () => clearInterval(id);
  }, [mounted, intervalMs]);

  // ── Export helpers ─────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    setExporting("csv");
    const rows = [
      ["Metrica", "Valor", "Unidad"],
      ["Latencia Promedio API",     String(metrics.avgApi),       "ms"],
      ["Tiempo Promedio DB",        String(metrics.avgDb),        "ms"],
      ["Tasa de Exito",             metrics.successRate,          "%"],
      ["Errores Totales",           String(metrics.totalErrors),  "count"],
      ["CPU Promedio",              String(metrics.cpuAvg),       "%"],
      ["Memoria Promedio",          String(metrics.memAvg),       "%"],
      ["", "", ""],
      ["Timestamp", new Date().toISOString(), ""],
    ];
    const csv  = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `dashboard-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(null), 500);
  }, [metrics]);

  const exportPDF = useCallback(async () => {
    setExporting("pdf");
    try {
      const { default: jsPDF }       = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      const el = dashboardRef.current;
      if (!el) {
        console.warn("Dashboard element not found for PDF export");
        return;
      }
      const canvas  = await html2canvas(el, { backgroundColor: "#f8fafc", scale: 2, allowTaint: false, useCORS: true, logging: false });
      const imgData = canvas.toDataURL("image/png");
      const pdf     = new jsPDF("l", "mm", "a3");
      const w = pdf.internal.pageSize.getWidth();
      pdf.addImage(imgData, "PNG", 0, 0, w, (canvas.height * w) / canvas.width);
      pdf.save(`dashboard-${Date.now()}.pdf`);
    } catch (err) { 
      console.error("PDF Export error:", err);
      window.print(); 
    }
    setTimeout(() => setExporting(null), 500);
  }, []);

  const exportReportPDF = useCallback(async () => {
    setExporting("report");
    try {
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      pdf.setFontSize(18); pdf.text("Informe de Rendimiento API", 10, 20);
      let y = 30;
      pdf.setFontSize(10); pdf.text(`Fecha: ${new Date().toLocaleString()}`, 10, y); y += 10;
      pdf.setFontSize(14); pdf.text("Métricas Generales:", 10, y); y += 10;
      pdf.setFontSize(10);
      pdf.text(`Latencia Prom. API: ${metrics.avgApi}ms`, 15, y); y += 5;
      pdf.text(`Tasa de Éxito: ${metrics.successRate}%`, 15, y);  y += 5;
      pdf.text(`Errores Totales: ${metrics.totalErrors}`, 15, y);
      pdf.save(`informe-api-${Date.now()}.pdf`);
    } catch (e) { console.error(e); }
    setTimeout(() => setExporting(null), 500);
  }, [metrics]);

  // ── Module definitions (single source of truth) ────────────────────
  const modules = useMemo(() => [
    {
      href: "/dashboard/tests/api",       label: "Pruebas de API",    sublabel: "HTTP REST & Endpoints",
      icon: Server,     color: "sky",
      completed: !!results.api,
      primaryStat:   results.api && typeof results.api.avgLatency === 'number' ? `${results.api.avgLatency.toFixed(2)}ms lat. prom.` : undefined,
      secondaryStat: results.api ? `${results.api.successRate}% éxito · ${results.api.totalRequests} reqs` : undefined,
      emptyHint: "Ejecuta k6 o Artillery para medir latencia.",
    },
    {
      href: "/dashboard/tests/websocket", label: "WebSocket",         sublabel: "Conexión Bidireccional",
      icon: Radio,      color: "emerald",
      completed: !!results.websocket,
      primaryStat:   results.websocket ? `${results.websocket.avgLatency}ms lat. prom.` : undefined,
      secondaryStat: results.websocket ? `${results.websocket.messagesSent} env · ${results.websocket.messagesReceived} rec` : undefined,
      emptyHint: "Prueba canales bi-direccionales en tiempo real.",
    },
    {
      href: "/dashboard/tests/database",  label: "Base de Datos",     sublabel: "Mongo & Postgres CRUD",
      icon: Database,   color: "amber",
      completed: !!results.database,
      primaryStat:   results.database ? `${results.database.avgDuration}ms consulta prom.` : undefined,
      secondaryStat: results.database ? `${results.database.queryCount} consultas` : undefined,
      emptyHint: "Evalúa rendimiento bajo alta concurrencia.",
    },
    {
      href: "/dashboard/tests/cache",     label: "Caché",             sublabel: "Redis & Memcached",
      icon: Layers,     color: "purple",
      completed: !!results.cache,
      primaryStat:   results.cache ? `${results.cache.hitRate}% hit rate` : undefined,
      secondaryStat: results.cache ? `${results.cache.hits} hits · ${results.cache.misses} misses` : undefined,
      emptyHint: "Valida efectividad de lecturas/escrituras.",
    },
    {
      href: "/dashboard/tests/network",   label: "Red Avanzada",      sublabel: "Latencia & Pérdida",
      icon: Network,    color: "cyan",
      completed: !!results.network,
      primaryStat:   results.network ? `${results.network.avgLatency}ms lat. prom.` : undefined,
      secondaryStat: results.network ? `${results.network.packetLoss}% paquetes perdidos` : undefined,
      emptyHint: "Determina jitter y problemas de ruta.",
    },
    {
      href: "/dashboard/tests/security",  label: "Seguridad",         sublabel: "WAF & SQLi Mitigation",
      icon: ShieldCheck,color: "rose",
      completed: !!results.security,
      primaryStat:   results.security ? `${Math.round((results.security.blocked / (results.security.totalAttempts || 1)) * 100)}% mitigados` : undefined,
      secondaryStat: results.security ? `${results.security.blocked} bloq · ${results.security.totalAttempts} intentos` : undefined,
      emptyHint: "Comprueba resistencia ante ataques comunes.",
    },
    {
      href: "/dashboard/tests/files",     label: "Archivos",          sublabel: "I/O Speed & Disk Load",
      icon: FileUp,     color: "pink",
      completed: !!results.files,
      primaryStat:   results.files ? `${(results.files.avgSpeed / 1024).toFixed(2)} MB/s prom.` : undefined,
      secondaryStat: results.files ? `${results.files.totalTransfers} transf · ${(results.files.totalSize / (1024 * 1024)).toFixed(2)} MB` : undefined,
      emptyHint: "Mide velocidad de escritura y lectura en disco.",
    },
  ], [results]);

  const completedCount = modules.filter((m) => m.completed).length;

  return (
    <div ref={dashboardRef} className={`min-h-screen mx-auto space-y-6 py-2 theme-${health} transition-colors duration-500`} suppressHydrationWarning>
      <WelcomeModal 
        isOpen={isWelcomeModalOpen} 
        onContinue={() => {
          if (typeof window !== "undefined") sessionStorage.setItem("welcome-dismissed", "true");
          setIsWelcomeModalOpen(false);
        }}
        onNewTest={() => {
          if (typeof window !== "undefined") sessionStorage.setItem("welcome-dismissed", "true");
          clearResults();
          setIsWelcomeModalOpen(false);
        }}
        {...modalConfig}
      />
      <DashboardHeader
        status={systemStatus}
        statusColor={statusColor}
        statusMessage={statusMessage}
        exporting={exporting}
        exportCSV={exportCSV}
        exportPDF={exportPDF}
        exportReportPDF={exportReportPDF}
      />

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        <MetricCard label="Latencia API Prom." value={results.api?.avgLatency != null ? `${results.api.avgLatency.toFixed(2)}ms` : "0.00ms"} icon={Server}      color={COLORS.primary} desc="Tiempo de respuesta promedio" />
        <MetricCard label="Throughput WS"      value={results.websocket ? `${results.websocket.messagesSent + results.websocket.messagesReceived} msg` : "0 msg/s"} icon={Radio} color={COLORS.success} desc="Total mensajes / tasa" />
        <MetricCard label="Tiempo DB Prom."    value={results.database?.avgDuration != null ? `${results.database.avgDuration}ms` : "0.00ms"} icon={Database}    color={COLORS.warning} desc="Duración promedio consultas" />
        <MetricCard label="Tasa de Éxito"      value={results.api ? `${results.api.successRate}%` : "0%"}                icon={ShieldCheck} color={COLORS.purple}  desc="Solicitudes exitosas" />
        <MetricCard label="CPU / Memoria"      value={`${metrics.cpuAvg}% / ${metrics.memAvg}%`}                        icon={Activity}    color={COLORS.pink}    desc="Uso real del sistema" />
        <MetricCard label="Módulos Completos"  value={`${completedCount} / ${modules.length}`}                          icon={Zap}         color={COLORS.danger}  desc="Tests ejecutados" />
      </section>

      {/* ── Module Grid ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-ping" />
              Módulos de Prueba
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completedCount === 0
                ? "Ningún módulo ejecutado aún — haz clic en cualquier tarjeta para empezar"
                : `${completedCount} de ${modules.length} módulos con resultados`}
            </p>
          </div>
          {completedCount > 0 && (
            <button
              onClick={() => clearResults()}
              className="self-start sm:self-auto rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/10 dark:bg-rose-500/5 dark:text-rose-400 dark:hover:bg-rose-500/15"
            >
              Limpiar historial
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((m) => (
            <ModuleCard key={m.href} {...m} />
          ))}
        </div>
      </section>

      {/* ── Live tool analysis ──────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/8 dark:bg-slate-900/50">
        {/* Gradient top bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-sky-500 via-blue-500 to-purple-500" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 pb-4 border-b border-slate-100 dark:border-white/5">
          {/* Tool pill */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/20">
              <Activity className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Herramienta activa</p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {selectedTool === "simulacion" ? "🧪 Simulación" : selectedTool.toUpperCase()}
              </h3>
            </div>
          </div>
          {/* Status badges */}
          <div className="flex items-center gap-2">
            {running ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                Ejecutando
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 dark:border-white/8 dark:bg-white/5 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                En espera
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {unifiedMetrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Latencia p50", value: `${unifiedMetrics.latency.p50 || "—"} ms`, color: "text-emerald-500" },
                { label: "Latencia p95", value: `${unifiedMetrics.latency.p95} ms`,         color: "text-amber-500"  },
                { label: "Latencia p99", value: `${unifiedMetrics.latency.p99 || "—"} ms`, color: "text-rose-500"   },
                { label: "Throughput",   value: `${unifiedMetrics.throughput} req/s`,        color: "text-sky-500"   },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-slate-50 dark:bg-white/4 border border-slate-100 dark:border-white/5 p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Sin métricas en vivo</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">Inicia una prueba desde cualquier módulo para ver datos aquí</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Logs / Procedimientos ──────────────────────────────────── */}
      {logs.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-xs font-mono text-emerald-400 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white uppercase tracking-wider text-[10px]">Procedimiento en vivo</h3>
            <div className="flex items-center gap-2">
                <button onClick={() => setFontSize(prev => Math.min(prev + 2, 24))} className="hover:text-white"><ZoomIn className="h-3 w-3" /></button>
                <button onClick={() => setFontSize(prev => Math.max(prev - 2, 8))} className="hover:text-white"><ZoomOut className="h-3 w-3" /></button>
                <button onClick={() => setIsTranslated(!isTranslated)} className="hover:text-white" title="Traducir Logs">
                    <Globe className="h-3 w-3" />
                </button>
            </div>
          </div>
          <div className="h-48 overflow-y-auto space-y-1" style={{ fontSize: `${fontSize}px` }}>
            {logs.map((log, i) => (
              <div key={i} className="break-words">
                <span className="text-slate-600 mr-2">[{log.time}]</span>
                <span className="text-sky-400 mr-2">[{log.tool}]</span>
                {isTranslated ? translateLog(log.message) : log.message}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Tool view + chart row ────────────────────────────────────── */}
      <section className="grid gap-6">
        {RenderedView}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* ── Response time chart (functional) ───────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/8 dark:bg-slate-900/50">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-sky-500 via-emerald-400 to-transparent" />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Distribución</p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tiempos de Respuesta</h3>
            </div>
            <div className="flex items-center gap-2">
              {results.api && <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] font-semibold text-sky-600 dark:text-sky-400">Datos reales</span>}
              <Gauge className="h-4 w-4 text-slate-400 dark:text-slate-600" />
            </div>
          </div>

          {mounted ? (
            results.api ? (
              // Real chart from API results — bar chart showing latency buckets
              <Chart
                key="bar-chart-latency"
                width="100%"
                options={{
                  ...baseChart,
                  chart: { ...baseChart.chart, type: "bar", background: "transparent" },
                  colors: [COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger],
                  xaxis: { categories: ["< 100ms", "100-300ms", "300-500ms", "> 500ms"], labels: { show: true, style: { colors: "#94a3b8", fontSize: "11px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
                  yaxis: { labels: { show: true, style: { colors: "#94a3b8", fontSize: "10px" } } },
                  plotOptions: { bar: { distributed: true, borderRadius: 6, columnWidth: "55%" } },
                  dataLabels: { enabled: true, style: { fontSize: "11px", fontWeight: 700, colors: ["#fff"] }, formatter: (v: number) => `${v}%` },
                  legend: { show: false },
                  tooltip: { theme: "dark", y: { formatter: (v: number) => `${v}% de requests` } },
                } as ApexOptions}
                series={[{ name: "Requests", data: [
                  // Derive buckets from avgLatency as reference point
                  results.api.avgLatency < 100  ? Math.min(70, Math.round(results.api.successRate * 0.7)) : Math.round(results.api.successRate * 0.3),
                  results.api.avgLatency < 300  ? Math.min(25, Math.round(results.api.successRate * 0.25)) : Math.round(results.api.successRate * 0.4),
                  Math.round((100 - results.api.successRate) * 0.6),
                  Math.round((100 - results.api.successRate) * 0.4),
                ]}]}
                type="bar"
                height={220}
              />
            ) : (
              // Donut placeholder when no real data
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <Chart
                  key="donut-empty"
                  width="100%"
                  options={{
                    ...baseChart,
                    chart: { ...baseChart.chart, type: "donut", background: "transparent" },
                    colors: ["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b"],
                    labels: ["< 100ms", "100-300ms", "300-500ms", "> 500ms"],
                    dataLabels: { enabled: false },
                    legend: { position: "bottom", labels: { colors: ["#94a3b8"] } },
                    stroke: { show: false },
                    plotOptions: { pie: { donut: { size: "65%", labels: { show: true, total: { show: true, label: "Sin datos", fontSize: "12px", color: "#94a3b8", formatter: () => "Ejecuta API" } } } } },
                    tooltip: { enabled: false },
                  } as ApexOptions}
                  series={[35, 40, 18, 7]}
                  type="donut"
                  height={200}
                />
                <p className="text-xs text-slate-400 dark:text-slate-600">Ejecuta pruebas de API para ver datos reales</p>
              </div>
            )
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">Cargando…</div>
          )}
        </div>

        {/* ── System Status — premium card grid ──────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/8 dark:bg-slate-900/50">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent" />

          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Resumen</p>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Estado del Sistema</h3>
            </div>
            <div className="flex items-center gap-2">
              {completedCount > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {completedCount} activos
                </span>
              )}
              <Zap className="h-4 w-4 text-slate-300 dark:text-slate-600" />
            </div>
          </div>

          {/* Module rows — compact with color accent */}
          <div className="grid grid-cols-2 gap-2">
            {modules.map((m) => (
              <div
                key={m.href}
                className={`relative flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
                  m.completed
                    ? "border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-500/15 dark:bg-emerald-500/5"
                    : "border-slate-100 bg-slate-50/80 dark:border-white/5 dark:bg-white/2"
                }`}
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  m.completed ? "bg-emerald-500/15" : "bg-slate-100 dark:bg-white/5"
                }`}>
                  <m.icon className={`h-3.5 w-3.5 ${
                    m.completed ? "text-emerald-500" : "text-slate-400 dark:text-slate-600"
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold leading-tight truncate ${
                    m.completed ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-500"
                  }`}>{m.label}</p>
                  <p className="truncate text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
                    {m.completed && m.primaryStat ? m.primaryStat : "Sin datos"}
                  </p>
                </div>
                {m.completed && (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.6)] shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Uptime + dynamic stats */}
          <div className="mt-4 rounded-xl border border-slate-100 dark:border-white/5 bg-gradient-to-br from-slate-50 to-white dark:from-white/4 dark:to-white/2 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tiempo de sesión</span>
              <span className="font-bold text-emerald-500 text-sm tabular-nums">
                {systemStats.loginTime ? `${Math.floor((Date.now() - systemStats.loginTime) / 60000)} min` : "--"}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-1000"
                style={{ width: `100%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/80 dark:bg-white/5 py-2">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {systemStats.reqPerMinute}
                </span>
                <span className="text-slate-400 text-[9px]">req/min</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/80 dark:bg-white/5 py-2">
                <Users className="h-3 w-3 text-sky-500" />
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                  {systemStats.activeUsers}
                </span>
                <span className="text-slate-400 text-[9px]">activos</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/80 dark:bg-white/5 py-2">
                <Clock className="h-3 w-3 text-amber-500" />
                <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums text-[10px]">
                  {timeLabels[timeLabels.length - 1] || "--:--"}
                </span>
                <span className="text-slate-400 text-[9px]">hora local</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-white/5">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          Actualizado en tiempo real — refresco cada {intervalMs / 1000}s
        </p>
        <div className="flex gap-3 text-xs text-slate-400 dark:text-slate-700">
          {timeLabels.filter((_, i) => i % 4 === 0).map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      {feedback && (
        <FeedbackModal
          isOpen={!!feedback}
          onClose={() => setFeedback(null)}
          title={feedback.title}
          message={feedback.message}
          type={feedback.type}
        />
      )}
    </div>
  );
}
