"use client";

import { useState, useEffect, useRef } from "react";
import { useTestResults } from "@/lib/test-results-context";
import { useSocket } from "@/lib/socket-context";
import { getBackendUrl } from "@/lib/api-url";
import {
  Shield, Play, X, Activity, Radar, ScanLine, Globe, Bug, KeyRound, Swords, FolderSearch, TestTube2, Filter, Droplets, Bomb, Timer, Gauge, ZoomIn, ZoomOut, Globe2, Terminal
} from "lucide-react";
import { translateLog } from "@/lib/log-translator";

interface SecurityTool {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: string;
  type: 'attack' | 'diagnostic';
}

const TOOLS: SecurityTool[] = [
  { id: "nmap", name: "Nmap", description: "Escaneo de puertos y detección de servicios", icon: Radar, color: "text-emerald-500", category: "Escaneo", type: 'diagnostic' },
  { id: "masscan", name: "Masscan", description: "Escaneo masivo de puertos (TCP rápido)", icon: ScanLine, color: "text-teal-500", category: "Escaneo", type: 'diagnostic' },
  { id: "nikto", name: "Nikto", description: "Escáner de vulnerabilidades web", icon: Bug, color: "text-red-500", category: "Escaneo", type: 'diagnostic' },
  { id: "hydra", name: "Hydra", description: "Fuerza bruta de credenciales (login)", icon: KeyRound, color: "text-amber-500", category: "Autenticación", type: 'attack' },
  { id: "sqlmap", name: "SQLMap", description: "Detección y explotación de SQL Injection", icon: Swords, color: "text-purple-500", category: "Explotación", type: 'attack' },
  { id: "gobuster", name: "Gobuster", description: "Enumeración de directorios y archivos", icon: FolderSearch, color: "text-sky-500", category: "Enumeración", type: 'diagnostic' },
  { id: "wfuzz", name: "WFuzz", description: "Fuzzing de rutas y parámetros HTTP", icon: TestTube2, color: "text-cyan-500", category: "Enumeración", type: 'attack' },
  { id: "ffuf", name: "FFUF", description: "Fuzzing rápido de directorios", icon: Filter, color: "text-indigo-500", category: "Enumeración", type: 'attack' },
  { id: "hping3", name: "Hping3", description: "Envío de paquetes TCP/IP personalizados", icon: Droplets, color: "text-orange-500", category: "Disponibilidad", type: 'attack' },
  { id: "siege", name: "Siege", description: "Prueba de estrés HTTP multiusuario", icon: Timer, color: "text-lime-500", category: "Disponibilidad", type: 'attack' },
  { id: "ab", name: "ApacheBench (ab)", description: "Benchmark de rendimiento HTTP", icon: Gauge, color: "text-pink-500", category: "Disponibilidad", type: 'diagnostic' },
  { id: "slowloris", name: "Slowloris", description: "Ataque de conexiones lentas HTTP", icon: Bomb, color: "text-red-500", category: "Disponibilidad", type: 'attack' },
];

export default function SecurityPage() {
  const socket = useSocket();
  const { setActiveLogs, activeLogs, isTestRunning, setIsTestRunning, results, publishSecurityResults } = useTestResults();

  const running = isTestRunning['security'] || false;
  const setRunning = (val: boolean) => setIsTestRunning('security', val);
  const logs = activeLogs['security'] || "";
  const setLogs = (val: string | ((prev: string) => string)) => setActiveLogs('security', val);

  const [mounted, setMounted] = useState(false);
  const [targetUrl, setTargetUrl] = useState("http://localhost:8080");
  const [selectedTools, setSelectedTools] = useState<string[]>(["nmap", "nikto", "gobuster"]);
  const [concurrency, setConcurrency] = useState(50);
  const [durationMs, setDurationMs] = useState(30000);
  const [toolStatus, setToolStatus] = useState<Record<string, boolean>>({});
  const [fontSize, setFontSize] = useState(12);
  const [isTranslated, setIsTranslated] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch(`${getBackendUrl()}/api/status`)
      .then(r => r.json())
      .then(d => setToolStatus(d.tools || {}))
      .catch(() => {});
  }, []);

  const toggleTool = (id: string) => {
    setSelectedTools(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!socket) return;
    const onTestData = (data: any) => {
      if (data.type === "complete" && (data.category === "security" || (!data.category && data.metrics?.totalAttempts !== undefined))) {
        setRunning(false);
        const m = data.metrics || data.summary || {};
        publishSecurityResults({
          totalAttempts: m.totalAttempts || 0,
          blocked: m.blocked || 0,
          allowed: m.allowed || 0,
          toolMetrics: m.toolMetrics || {}
        });
      }
    };
    socket.on("test-data", onTestData);
    return () => {
      socket.off("test-data", onTestData);
    };
  }, [socket, publishSecurityResults]);

  const runTest = () => {
    if (running || selectedTools.length === 0 || !socket) return;
    setLogs("");
    setRunning(true);

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

    const endpoints = [{ endpoint: targetUrl, method: "GET", concurrency, duration: durationMs / 1000, requests: 100 }];
    socket.emit("start-test", {
      tools: selectedTools,
      targetUrl,
      concurrency,
      durationMs,
      endpoints,
      requests: 100,
      category: 'security',
      userId,
      token
    });
  };

  const cancelTest = () => {
    socket?.emit("cancel-test");
  };

  const securityResults = results.security || { totalAttempts: 0, blocked: 0, allowed: 0, toolMetrics: {} };
  const toolMetrics = securityResults.toolMetrics || {};
  const totalFindings = securityResults.allowed;
  const totalRequests = securityResults.totalAttempts;
  const errors = securityResults.blocked;
  const reportData = securityResults;

  return (
    <div className="mx-auto space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* CABECERA Y CONFIGURACIÓN */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-950 dark:text-white">Pruebas de Seguridad</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Herramientas de pentesting contra tu servidor (nmap, sqlmap, hydra, ffuf...)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runTest}
              disabled={running || selectedTools.length === 0}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:bg-sky-600 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {running ? "Ejecutando..." : `Ejecutar (${selectedTools.length})`}
            </button>
            {running && (
              <button
                onClick={cancelTest}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Target URL</label>
            <input
              type="text"
              value={targetUrl}
              disabled={running}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="http://localhost:8080"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-sky-500/60 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Concurrencia</label>
            <input
              type="number"
              value={concurrency}
              disabled={running}
              onChange={(e) => setConcurrency(Number(e.target.value) || 1)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-sky-500/60 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Duración (ms)</label>
            <input
              type="number"
              value={durationMs}
              disabled={running}
              onChange={(e) => setDurationMs(Number(e.target.value) || 10000)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-sky-500/60 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50"
            />
          </div>
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          ⚠️ Úsalo solo contra servidores que tengas autorización de probar (los tuyos).
        </p>
      </div>

      {/* SELECCIÓN DE HERRAMIENTAS */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Selecciona herramientas</h2>
        
        {['attack', 'diagnostic'].map(type => (
          <div key={type} className="mb-6">
            <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">
              {type === 'attack' ? 'Ofensivas (Ataque)' : 'Diagnóstico / Análisis'}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.filter(t => t.type === type).map((t) => {
                const selected = selectedTools.includes(t.id);
                const installed = toolStatus[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTool(t.id)}
                    disabled={running}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? "border-sky-500/60 bg-sky-500/10 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20"
                    }`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 ${t.color}`}>
                      <t.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-lg font-semibold text-slate-800 dark:text-slate-200">{t.name}</p>
                        {installed === false && (
                          <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-500">No instalado</span>
                        )}
                        {installed && (
                          <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-500">OK</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-slate-400">{t.description}</p>
                      <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">{t.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* MÉTRICAS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Hallazgos encontrados", value: totalFindings.toString(), icon: Bug, color: "text-red-500" },
          { label: "Errores / fallos", value: errors.toString(), icon: X, color: "text-amber-500" },
          { label: "Total procesado", value: totalRequests.toString(), icon: Activity, color: "text-sky-500" },
          { label: "Herramientas usadas", value: Object.keys(toolMetrics).filter(k => toolMetrics[k]).length.toString(), icon: Shield, color: "text-purple-500" },
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

      {/* CONSOLA DE LOGS */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
            <Terminal className="h-4 w-4 text-sky-500" /> Consola de ejecución
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setFontSize(prev => Math.min(prev + 2, 24))} className="p-1.5 text-slate-400 hover:text-white"><ZoomIn className="h-3.5 w-3.5" /></button>
            <button onClick={() => setFontSize(prev => Math.max(prev - 2, 8))} className="p-1.5 text-slate-400 hover:text-white"><ZoomOut className="h-3.5 w-3.5" /></button>
            <button onClick={() => setIsTranslated(!isTranslated)} className="p-1.5 text-slate-400 hover:text-white" title="Traducir Logs"><Globe2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-emerald-400" style={{ fontSize: `${fontSize}px` }}>
            {isTranslated ? translateLog(logs) : (logs || "[SISTEMA] Selecciona herramientas y pulsa Ejecutar para ver los logs en vivo...")}
          </pre>
        </div>
      </div>

      {/* RESULTADOS POR HERRAMIENTA */}
      {Object.keys(results.security?.toolMetrics || {}).filter(k => results.security?.toolMetrics[k]).length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(results.security?.toolMetrics || {}).filter(([k, v]) => v).map(([tool, m]: [string, any]) => {
            const t = TOOLS.find(x => x.id === tool);
            return (
              <div key={tool} className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t && <t.icon className={`h-4 w-4 ${t.color}`} />}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t?.name || tool}</h3>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {m?.successCount || 0} hallazgos
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/40">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Hallazgos</p>
                    <p className="text-lg font-bold text-red-500">{m?.successCount || 0}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/40">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Errores</p>
                    <p className="text-lg font-bold text-amber-500">{m?.failCount || 0}</p>
                  </div>
                </div>
                {m?.rawOutput && (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Detalles de ejecución</p>
                    <pre className="max-h-32 overflow-y-auto rounded-xl bg-slate-950 p-3 text-[10px] font-mono text-emerald-400 whitespace-pre-wrap">
                      {m.rawOutput}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* RESULTADO PUBLICADO */}
      {reportData.totalAttempts > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Reporte: <span className="font-semibold text-slate-900 dark:text-white">{reportData.allowed}</span> hallazgos · <span className="font-semibold text-slate-900 dark:text-white">{reportData.blocked}</span> errores · <span className="font-semibold text-slate-900 dark:text-white">{reportData.totalAttempts}</span> procesados
          </p>
          <button
            onClick={() => publishSecurityResults({ totalAttempts: reportData.totalAttempts, blocked: reportData.blocked, allowed: reportData.allowed, toolMetrics: reportData.toolMetrics || {} })}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold uppercase text-white transition hover:bg-sky-600"
          >
            <Globe className="h-3.5 w-3.5" /> Publicar resultados en el resumen
          </button>
        </div>
      )}
    </div>
  );
}
