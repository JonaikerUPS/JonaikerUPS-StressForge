"use client";

import { useState, useEffect, useCallback, ChangeEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUnifiedTest } from "@/lib/unified-test-context";
import { useTestResults } from "@/lib/test-results-context";
import { type HttpMethod, type EndpointConfig } from "@/lib/api-test-config-context";
import {
  Server, Play, Pencil, Trash2, Plus, X, FileText, Download,
  BarChart3, Terminal, ClipboardList, AlertTriangle, HeartPulse, Key, Code, Activity, ShieldCheck, ChevronDown, ChevronUp, Eye, ZoomIn, ZoomOut, Globe
} from "lucide-react";
import { translateLog } from "@/lib/log-translator";
import { parseLog } from "@/lib/metrics-adapter";
import LoadTestDashboard from "@/components/dashboard/LoadTestDashboard";
import { InspectionModal } from "@/components/InspectionModal";
import { TOOL_SCHEMAS } from "@/lib/tool-schemas";
import { useSocket } from "@/lib/socket-context";
import { checkToolStatus } from "@/lib/api-client";
import { GeneralSummaryReport, generatePDF, generateEndpointPDF } from "@/components/dashboard/GeneralSummaryReport";

type EndpointStatus = "idle" | "running" | "success" | "error";

interface EndpointTest extends EndpointConfig {
  status: EndpointStatus;
  latency: number | { avg: number; p95: number; p99: number } | null;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  successCount?: number;
  failCount?: number;
  totalReqs?: number;
  minLatency?: number;
  maxLatency?: number;
  configSnapshot?: Record<string, number>;
  p50?: number;
  p95?: number;
  p99?: number;
  headers?: Record<string, string>;
  requestBody?: string;
  duration?: number;
  params?: Record<string, number>;
}

interface SocketLoadData {
  type: "load";
  errorRate: number;
  latency: { avg: number; p95: number; p99: number };
  throughput: number;
  concurrency?: number;
  duration?: number;
}

interface SocketApiEndpoint {
  url: string;
  latency: number;
  status: EndpointStatus;
  statusCode?: number;
}

interface SocketApiData {
  type: "api";
  endpoints?: SocketApiEndpoint[];
}

interface SocketCompleteData {
  type: "complete";
}

type SocketTestData = SocketLoadData | SocketApiData | SocketCompleteData;

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  POST: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20",
  PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  PATCH: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
};

export default function ApiTestsPage() {
  const {
    selectedTool, config, updateConfig,
    endpoints: storedEndpoints, lastRuns,
    addEndpoint, removeEndpoint: contextRemoveEndpoint, updateEndpoint, clearEndpoints,
  } = useUnifiedTest();

  const socket = useSocket();
  const {
    setActiveLogs,
    activeLogs,
    results,
    clearResults,
    publishApiResults,
    isTestRunning,
    setIsTestRunning
  } = useTestResults();

  // Estados locales para manejar modales y loading
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [testSessionId, setTestSessionId] = useState(0); // Para forzar re-mount al iniciar nueva prueba
  const [liveMetrics, setLiveMetrics] = useState<any>({});
  const [progress, setProgress] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSkeletons, setShowSkeletons] = useState(false);

  useEffect(() => {
    if (showLoadingModal) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 95 ? 95 : prev + 1));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showLoadingModal]);

  useEffect(() => {
    if (showLoadingModal && !isTestRunning) {
      setShowLoadingModal(false);
    }
  }, [isTestRunning, showLoadingModal]);

  const removeEndpoint = (id: number) => {
    contextRemoveEndpoint(id);
    clearResults();
  };

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  const resetUI = useCallback(() => {
    setIsTestRunning('api', false);
    setShowLoadingModal(false);
    setShowSkeletons(false);
    setProgress(0);
  }, [setIsTestRunning]);

  const clearUI = useCallback(() => {
    // Solo limpia elementos visuales, NO cambia el estado de 'running'
    setShowLoadingModal(false);
    setShowSkeletons(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onTestUpdate = (data: any) => {
      if (data.type === "metrics" && data.data) {
        setLiveMetrics(data.data);
      }
      
      if (data.type === "log" && data.log) {
        if (Date.now() - lastLogUpdateRef.current < 50) return;
        lastLogUpdateRef.current = Date.now();
        
        // Detectar finalización o cancelación
        if (data.log.includes("Finalizado con código 0") || 
            data.log.includes("Post-processing...") ||
            data.log.includes("Test cancelled")) {
          clearUI();
        }

        setActiveLogs('api', (prev: string) => prev + `[${data.tool}] ${data.log}\n`);
      }
      
      if (data.type === "complete" && data.metrics) {
        resetUI();
      }
    };

    const onTestData = (data: any) => {
        if (data.type === "complete") {
          resetUI();
          
          // Actualizar métricas
          setMetricsHistory((prev: any[]) => {
            const newItem = {
              latency: data.summary?.avgLatency || 0,
              throughput: data.summary?.throughput || 0,
              step: prev.length + 1
            };
            return [...prev, newItem].slice(-20);
          });

          // Actualizar endpoints directamente con los resultados finales
          if (data.endpoints) {
            setTestEndpoints(prev => {
              const updated = prev.map(ep => {
                // Normalize URLs: strip trailing slash, compare both directions
                const normalizeUrl = (u: string) => u.replace(/\/$/, '').toLowerCase();
                const epNorm = normalizeUrl(ep.endpoint);
                const apiEp = data.endpoints.find((a: any) => {
                  const aNorm = normalizeUrl(a.url || '');
                  return (epNorm === aNorm || epNorm.includes(aNorm) || aNorm.includes(epNorm))
                    && (ep.method === a.method || a.method === 'GET');
                });
                if (apiEp) {
                  const reqs = apiEp.totalRequests || apiEp.successful || 0;
                  return {
                    ...ep,
                    status: (apiEp.status === "error" ? "error" : "success") as EndpointStatus,
                    latency: apiEp.avgLatency || apiEp.latency || 0,
                    successCount: apiEp.successful || apiEp.successCount || 0,
                    failCount: apiEp.failed || apiEp.failCount || 0,
                    totalReqs: reqs,
                    configSnapshot: { duration: ep.duration || 10 },
                    p50: apiEp.p50 || apiEp.percentiles?.p50 || 0,
                    p95: apiEp.p95 || apiEp.percentiles?.p95 || 0,
                    p99: apiEp.p99 || apiEp.percentiles?.p99 || 0,
                  };
                }
                return ep;
              });
              // After updating endpoints, save them as lastTestEndpoints
              setLastTestEndpoints(updated);
              return updated;
            });
            // Publicar resultados de API en el contexto global de test results
            try {
              const published = data.endpoints.map((ep: any) => ({
                url: ep.url,
                method: ep.method || 'GET',
                latency: ep.avgLatency || ep.latency || 0,
                status: (ep.status === "error" || (ep.failed && ep.failed > 0 && !ep.successful)) ? ("error" as const) : ("success" as const),
                throughput: ep.throughput || data.summary?.throughput || 0,
                errorRate: ep.errorRate || (ep.failed && (ep.successful + ep.failed) > 0 ? (ep.failed / (ep.successful + ep.failed)) * 100 : 0)
              }));
              publishApiResults(published);
            } catch (err) {
              console.error("Error publishing api results:", err);
            }
          }
        }
    };

    const onEndpointValidated = (data: { id: number, status: number, ok: boolean, body?: string, error?: string, latency?: number }) => {
      setTestEndpoints(prev => prev.map(ep => {
        if (ep.id === data.id) {
          return {
            ...ep,
            status: data.ok ? "success" : "error",
            statusCode: data.status,
            responseBody: data.body,
            errorMessage: data.error,
            latency: data.latency || 0
          };
        }
        return ep;
      }));
    };

    socket.on("test-update", onTestUpdate);
    socket.on("test-data", onTestData);
    socket.on("endpoint-validated", onEndpointValidated);

    return () => {
      socket.off("test-update", onTestUpdate);
      socket.off("test-data", onTestData);
      socket.off("endpoint-validated", onEndpointValidated);
    };
  }, [socket, setActiveLogs, publishApiResults]);

  const [testEndpoints, setTestEndpoints] = useState<EndpointTest[]>([]);
  const [lastTestEndpoints, setLastTestEndpoints] = useState<EndpointTest[]>([]);
  const testEndpointsRef = useRef<EndpointTest[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const lastLogUpdateRef = useRef(0);

  useEffect(() => {
    testEndpointsRef.current = testEndpoints;
  }, [testEndpoints]);

  useEffect(() => {
    if (!results?.api) {
      setTestEndpoints(prev => {
        const next = storedEndpoints.map(ep => {
          const existing = (prev as any[]).find((p: any) => p.id === ep.id);
          if (existing) return { ...existing, ...ep };
          return { ...ep, status: "idle" as const, latency: null };
        });
        testEndpointsRef.current = next;
        return next;
      });
      return;
    }

    const normalizeUrl = (u: string) => u.replace(/\/$/, '').toLowerCase();
    const apiEndpoints = results.api.endpoints || [];
    setTestEndpoints(prev => {
      const next = storedEndpoints.map(ep => {
        const epNorm = normalizeUrl(ep.endpoint);
        const apiEp = apiEndpoints.find((a: any) => {
          const aNorm = normalizeUrl(a.url || '');
          return (epNorm === aNorm || epNorm.includes(aNorm) || aNorm.includes(epNorm))
            && (ep.method === a.method || a.method === 'GET');
        });
        const existing = (prev as any[]).find((p: any) => p.id === ep.id);
        if (apiEp) {
          const reqs = apiEp.totalRequests || apiEp.successful || 0;
          return {
            ...ep,
            status: (apiEp.status === "error" ? "error" : "success") as EndpointStatus,
            latency: apiEp.avgLatency || apiEp.latency || 0,
            successCount: apiEp.successful || 0,
            failCount: apiEp.failed || 0,
            totalReqs: reqs,
            configSnapshot: { duration: 10 },
            p50: apiEp.p50 || apiEp.percentiles?.p50 || 0,
            p95: apiEp.p95 || apiEp.percentiles?.p95 || 0,
            p99: apiEp.p99 || apiEp.percentiles?.p99 || 0,
          };
        }
        if (existing) return { ...existing, ...ep };
        return { ...ep, status: "idle" as const, latency: null };
      });
      testEndpointsRef.current = next;
      return next;
    });
  }, [storedEndpoints, results]);

  const [running, setRunning] = useState(false);
  useEffect(() => { setRunning(!!isTestRunning['api']); }, [isTestRunning]);

  useEffect(() => {
    if (running && testEndpoints.length === 0) {
      if (socket) {
        socket.emit('cancel-test');
      }
      resetUI();
    }
  }, [testEndpoints, running, socket, resetUI]);


  // Sincronizar historial local con resultados del contexto
  useEffect(() => {
    if (results?.api) {
      setMetricsHistory(prev => {
        const newItem = {
          latency: results.api?.avgLatency || 0,
          throughput: (results.api as any)?.throughput || 0,
          step: prev.length + 1
        };
        // Mantener solo los últimos 20 puntos para la gráfica
        return [...prev, newItem].slice(-20);
      });
    }
  }, [results]);

  const [viewMode, setViewMode] = useState<"graphs" | "logs" | "reports">("graphs");
  const [fontSize, setFontSize] = useState(12);
  const [isTranslated, setIsTranslated] = useState(false);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<number, boolean>>({});
  const [inspectingEndpoint, setInspectingEndpoint] = useState<EndpointTest | null>(null); // AÑADIDO

  const toggleExpand = (id: number) => {
    setExpandedEndpoints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [newEndpoint, setNewEndpoint] = useState("");
  const [newMethod, setNewMethod] = useState<HttpMethod>("GET");

  const [editingId, setEditingId] = useState<number | null>(null);

  const [headerKey, setHeaderKey] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});
  const [requestBodyJson, setRequestBodyJson] = useState("");
  const [bodyType, setBodyType] = useState<"json" | "xml" | "urlencoded">("json");

  const [newConfig, setNewConfig] = useState<Record<string, number>>({
    concurrency: 0,
    requests: 0,
    duration: 0,
    rampUp: 0,
  });

  const activeSchema = TOOL_SCHEMAS[selectedTool] || null;

  const addHeader = () => {
    if (!headerKey.trim()) return;
    setCustomHeaders(prev => ({ ...prev, [headerKey.trim()]: headerValue }));
    setHeaderKey("");
    setHeaderValue("");
  };

  const removeHeader = (key: string) => {
    setCustomHeaders(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const runAllTests = () => {
    if (running || showLoadingModal || testEndpoints.length === 0) return;
    setShowSkeletons(true);
    setShowLoadingModal(true);
    setLiveMetrics({}); // Limpiar métricas para el nuevo test
    setTestSessionId(Date.now()); // Nueva sesión al iniciar test
    // NOTE: setLastTestEndpoints is now updated AFTER test completes (in onTestData), not here
    setIsTestRunning('api', true);
    clearResults(); // <-- LIMPIEZA TOTAL DE RESULTADOS ANTERIORES
    setActiveLogs('api', "");    // <-- LIMPIEZA DE LOGS
    if (socket) {
      let token: string | undefined;
      let userId: string | undefined;
      try {
        const auth = typeof window !== 'undefined' ? localStorage.getItem('admin-auth') : null;
        if (auth) {
          const parsed = JSON.parse(auth);
          token = parsed.token;
          userId = parsed.userId || parsed.user?.id || parsed.id;
        }
      } catch (e) {}

      // Usamos la configuración específica de cada endpoint en lugar de una global
      socket.emit("start-test", {
        category: 'api',
        userId,
        token,
        tool: selectedTool,
        endpoints: testEndpoints.map(ep => ({
          ...ep,
          // Aseguramos que se envíen los parámetros de carga individualmente
          concurrency: ep.concurrency || 1,
          durationMs: (ep.duration || 10) * 1000,
          requests: ep.requests || 1,
          rampUp: ep.rampUp || 0,
        })),
        headers: customHeaders,
        body: requestBodyJson,
        bodyType,
      });
    }
  };

  const validateEndpoint = (ep: EndpointTest) => {
    if (!socket) return;
    socket.emit("validate-endpoint", { id: ep.id, endpoint: ep.endpoint });
  };

  const startEdit = (ep: EndpointTest) => {
    setEditingId(ep.id ?? null);
    setNewMethod(ep.method);
    setNewEndpoint(ep.endpoint);
    // Cargar la configuración de carga al estado de edición
    setNewConfig({
      concurrency: ep.concurrency || 0,
      requests: ep.requests || 0,
      duration: ep.duration || 0,
      rampUp: ep.rampUp || 0,
    });
  };

  const downloadGeneralPDF = () => {
    try {
      generatePDF({
        ...generalReportData,
        logs: activeLogs,
        rawOutput: (results?.api as any)?.rawOutput,
      });
    } catch (error) {
      console.error("Error generating general PDF", error);
    }
  };

  const downloadEndpointPDF = (ep: EndpointTest) => {
    try {
      generateEndpointPDF(ep);
    } catch (error) {
      console.error("Error generating endpoint PDF", error);
    }
  };

  // Use testEndpoints (which has the live socket data) to drive displayEndpoints
  // When running: show testEndpoints live. After test: lastTestEndpoints holds updated results.
  // Fall back to testEndpoints if lastTestEndpoints is still empty (first run).
  const displayEndpoints = running
    ? testEndpoints
    : (lastTestEndpoints.some(ep => ep.totalReqs) ? lastTestEndpoints : testEndpoints);

  // Compute aggregates from displayEndpoints for accurate report numbers
  const _totalRequests = displayEndpoints.reduce((s, ep) => s + (ep.totalReqs || 0), 0);
  const _totalSuccess  = displayEndpoints.reduce((s, ep) => s + (ep.successCount || 0), 0);
  const _overallSuccessRate = _totalRequests > 0 ? Math.round((_totalSuccess / _totalRequests) * 100) : (results?.api?.successRate ?? 0);

  const generalReportData = {
    summary: {
      totalEndpoints: displayEndpoints.length,
      successful: displayEndpoints.filter((ep) => ep.status === "success").length,
      failed: displayEndpoints.filter((ep) => ep.status === "error").length,
      avgLatency: displayEndpoints.reduce((sum, ep) => {
        const value = typeof ep.latency === "number" ? ep.latency : (ep.latency as any)?.avg ?? 0;
        return sum + value;
      }, 0) / Math.max(displayEndpoints.length, 1),
    },
    endpoints: displayEndpoints.map((ep) => ({
      endpoint: ep.endpoint,
      method: ep.method,
      status: ep.status,
      latency: typeof ep.latency === "number" ? ep.latency : (ep.latency as any)?.avg ?? 0,
      successCount: ep.successCount ?? 0,
      failCount: ep.failCount ?? 0,
      totalReqs: ep.totalReqs ?? 0,
      p50: ep.p50 ?? 0,
      p95: ep.p95 ?? 0,
      p99: ep.p99 ?? 0,
    })),
  };

  return (
    <div className="space-y-6">
      {/* CONFIGURACIÓN Y PARÁMETROS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA DE CONFIGURACIÓN DE ENDPOINT */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/20 dark:backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Endpoint URL</label>
              <input
                type="text"
                value={newEndpoint}
                disabled={running}
                onChange={(e) => setNewEndpoint(e.target.value)}
                placeholder="https://api.ejemplo.com/v1/usuarios"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-sky-500/60 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Latencia Máx (ms)</label>
              <input
                type="number"
                value={newConfig.maxLatency || ""}
                disabled={running}
                onChange={(e) => setNewConfig(prev => ({ ...prev, maxLatency: Number(e.target.value) }))}
                placeholder="500"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-sky-500/60 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Método HTTP</label>
              <select
                value={newMethod}
                disabled={running}
                onChange={(e) => setNewMethod(e.target.value as HttpMethod)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500/60 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50"
              >
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Botones de acción para endpoint */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                if (!newEndpoint.trim()) return;

                // Configuración de carga que se guardará en el endpoint
                  const configToSave = {
                    ...newConfig,
                    // Asegurar valores mínimos
                    concurrency: newConfig.concurrency || 1,
                    duration: newConfig.duration || 10,
                    requests: newConfig.requests || 1,
                    rampUp: newConfig.rampUp || 0,
                    headers: customHeaders as any,
                    body: requestBodyJson,
                  };

                if (editingId !== null) {
                  updateEndpoint(editingId, {
                    endpoint: newEndpoint,
                    method: newMethod,
                    ...configToSave,
                  });
                  setEditingId(null);
                } else {
                  addEndpoint(
                    newEndpoint,
                    newMethod,
                    requestBodyJson,
                    configToSave
                  );
                }
                setNewEndpoint("");
                setNewConfig({
                  concurrency: 0,
                  requests: 0,
                  duration: 0,
                  rampUp: 0,
                });
              }}
              className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50"
              disabled={running}
            >
              {editingId !== null ? "Actualizar Endpoint" : "Añadir Endpoint"}
            </button>
            {editingId !== null && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setNewEndpoint("");
                  setNewConfig({
                    concurrency: 0,
                    requests: 0,
                    duration: 0,
                    rampUp: 0,
                  });
                }}
                className="rounded-xl bg-slate-200 hover:bg-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white"
              >
                Cancelar
              </button>
            )}
          </div>

          {/* Headers */}
          <div className="space-y-2 pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
            <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <Key className="h-3 w-3 text-sky-500" /> Headers personalizados
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Key"
                value={headerKey}
                disabled={running}
                onChange={(e) => setHeaderKey(e.target.value)}
                className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs outline-none text-slate-900 focus:border-sky-500/40 dark:border-white/5 dark:bg-slate-950/40 dark:text-white disabled:opacity-50"
              />
              <input
                type="text"
                placeholder="Value"
                value={headerValue}
                disabled={running}
                onChange={(e) => setHeaderValue(e.target.value)}
                className="w-1/2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs outline-none text-slate-900 focus:border-sky-500/40 dark:border-white/5 dark:bg-slate-950/40 dark:text-white disabled:opacity-50"
              />
              <button onClick={addHeader} disabled={running} className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-white/10 dark:text-white disabled:opacity-50">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {Object.keys(customHeaders).length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-950/20 dark:border-white/5">
                {Object.entries(customHeaders).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded text-[10px] font-mono">
                    {k}: {v}
                    <X onClick={() => removeHeader(k)} className="h-2.5 w-2.5 cursor-pointer hover:text-red-500" />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Body Dinámico */}
          {["POST", "PUT", "PATCH"].includes(newMethod) && (
            <div className="space-y-1 pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Code className="h-3 w-3 text-amber-500" /> Payload Body
                </label>
                <select
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-700 outline-none focus:border-sky-500/50 cursor-pointer dark:bg-slate-950 dark:border-white/10 dark:text-slate-300"
                >
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="urlencoded">Form URL</option>
                </select>
              </div>
              <textarea
                value={requestBodyJson}
                disabled={running}
                onChange={(e) => setRequestBodyJson(e.target.value)}
                placeholder={
                  bodyType === "json" ? '{\n  "name": "test",\n  "active": true\n}' :
                    bodyType === "xml" ? '<request>\n  <name>test</name>\n</request>' :
                      'name=test&active=true'
                }
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-amber-700 outline-none focus:border-amber-500/40 resize-none dark:border-white/5 dark:bg-slate-950/60 dark:text-amber-300 disabled:opacity-50"
              />
            </div>
          )}
        </section>

        {/* PARÁMETROS CONFIGURABLES */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/20 dark:backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2 mb-4">
              Parámetros Configurables ({activeSchema?.label || selectedTool?.toUpperCase()})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeSchema?.parameters?.map((param: any) => (
                <div key={param.id}>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    {param.label}
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 leading-tight">{param.description}</p>
                  <input
                    type={param.type}
                    disabled={running}
                    value={isNaN(newConfig[param.id]) ? "" : newConfig[param.id]}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      setNewConfig(prev => ({ ...prev, [param.id]: isNaN(num) ? 0 : num }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500/50 dark:border-white/10 dark:bg-slate-950/40 dark:text-white disabled:opacity-50"
                  />
                </div>
              ))}

              {!activeSchema && (
                <p className="text-xs text-slate-400 dark:text-slate-500 col-span-2">No se requieren configuraciones adicionales para esta herramienta.</p>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={runAllTests}
              disabled={running || showLoadingModal || testEndpoints.length === 0}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white hover:from-emerald-500 hover:to-teal-500 shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all relative overflow-hidden"
            >
              {running || showLoadingModal ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>PROCESANDO PRUEBAS EN TIEMPO REAL...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>EJECUTAR BATERÍA DE PRUEBAS COMPLETA</span>
                </>
              )}
            </button>
            {running ? (
              <button
                onClick={() => socket?.emit('cancel-test')}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-3 text-sm font-bold text-white shadow-md transition-all"
              >
                <X className="h-4 w-4" />
                <span>CANCELAR PRUEBA</span>
              </button>
            ) : testEndpoints.length > 0 ? (
              <button
                onClick={clearEndpoints}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-md transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span>LIMPIAR ENDPOINTS</span>
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {/* COLA DE ENDPOINTS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/10">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Endpoints en Cola ({testEndpoints.length})</h3>
        {testEndpoints.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 dark:border-white/10 dark:text-slate-500 text-sm">
            No hay URLs añadidas. Configura una arriba.
          </div>
        ) : (
          <div className="space-y-2">
            {testEndpoints.map((ep) => (
              <div key={ep.id} className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 dark:bg-slate-950/40 dark:border-white/5">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                  <span className="font-mono text-sm truncate text-slate-700 dark:text-slate-200">{ep.endpoint}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {(TOOL_SCHEMAS[selectedTool]?.parameters || []).map(p => {
                      const val = (ep as any)[p.id];
                      if (val == null) return null;
                      const shortLabel = p.id === 'concurrency' ? (selectedTool === 'vegeta' ? 'Rate' : 'VU') : p.id === 'duration' ? 'Dur' : p.id === 'requests' ? 'Req' : p.id === 'rampUp' ? 'Ramp' : p.id;
                      return `${val} ${shortLabel}`;
                    }).filter(Boolean).join(' | ') || 'Config por defecto'}
                  </div>
                  {ep.responseBody && (
                    <button
                      onClick={() => {
                        if (!expandedEndpoints[ep.id]) {
                          toggleExpand(ep.id);
                        }
                        setTimeout(() => {
                          const el = document.getElementById(`endpoint-detail-${ep.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {ep.latency !== null && (
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{(typeof ep.latency === 'object' ? (ep.latency as any)?.avg : ep.latency)?.toFixed(2) ?? 0} ms</span>
                  )}

                  <div className="metrics-container">
                    {/* Metric Success */}
                    <div className="metric-group">
                      <div className="metric-header">
                        <span className="metric-label success">SUCCESS {ep.successCount || 0}</span>
                        <svg className="icon success" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill success" style={{ width: `${((ep.successCount || 0) / Math.max((ep.successCount || 0) + (ep.failCount || 0), 1)) * 100}%` }}></div>
                      </div>
                    </div>
                    {/* Metric Fail */}
                    <div className="metric-group">
                      <div className="metric-header">
                        <span className="metric-label fail">FAIL {ep.failCount || 0}</span>
                        <svg className="icon fail" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill fail" style={{ width: `${((ep.failCount || 0) / Math.max((ep.successCount || 0) + (ep.failCount || 0), 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <style jsx>{`
                    .metrics-container {
                      display: flex;
                      align-items: center;
                      gap: 16px;
                      background-color: #f3f4f6;
                      padding: 8px 12px;
                      border-radius: 8px;
                      width: fit-content;
                    }
                    :global(.dark) .metrics-container {
                      background-color: #1e293b;
                    }
                    .metric-group {
                      display: flex;
                      flex-direction: column;
                      gap: 4px;
                      min-width: 90px;
                    }
                    .metric-header {
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      gap: 6px;
                    }
                    .metric-label {
                      font-size: 11px;
                      font-weight: 700;
                      letter-spacing: 0.5px;
                      font-family: sans-serif;
                    }
                    .metric-label.success { color: #047857; }
                    .metric-label.fail { color: #b91c1c; }
                    :global(.dark) .metric-label.success { color: #34d399; }
                    :global(.dark) .metric-label.fail { color: #f87171; }
                    .icon { width: 14px; height: 14px; }
                    .icon.success { color: #047857; }
                    .icon.fail { color: #b91c1c; }
                    :global(.dark) .icon.success { color: #34d399; }
                    :global(.dark) .icon.fail { color: #f87171; }
                    .progress-bar-bg {
                      width: 100%;
                      height: 5px;
                      background-color: #e5e7eb;
                      border-radius: 9999px;
                      overflow: hidden;
                    }
                    :global(.dark) .progress-bar-bg { background-color: #334155; }
                    .progress-bar-fill {
                      height: 100%;
                      border-radius: 9999px;
                      transition: width 0.3s ease;
                    }
                    .progress-bar-fill.success { background-color: #047857; }
                    .progress-bar-fill.fail { background-color: #b91c1c; }
                    :global(.dark) .progress-bar-fill.success { background-color: #34d399; }
                    :global(.dark) .progress-bar-fill.fail { background-color: #f87171; }
                  `}</style>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setInspectingEndpoint(ep)} disabled={running} title="Inspeccionar Configuración" className="p-1.5 text-slate-400 hover:text-sky-500 transition-colors disabled:opacity-50"><Code className="h-3.5 w-3.5" /></button>
                    <button onClick={() => validateEndpoint(ep)} disabled={running} title="Validar Endpoint" className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors disabled:opacity-50"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => startEdit(ep)} disabled={running} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors disabled:opacity-50"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeEndpoint(ep.id)} disabled={running} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN ANALÍTICA CENTRALIZADA */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/30 dark:backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Análisis Técnico y Métricas</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400">Evalúa el rendimiento visualmente, mediante logs crudos o reportes ejecutivos.</p>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 dark:bg-slate-950 dark:border-white/5 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("graphs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "graphs" ? "bg-white text-sky-600 shadow-sm dark:bg-sky-500 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Gráficas
            </button>
            <button
              onClick={() => setViewMode("logs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "logs" ? "bg-white text-sky-600 shadow-sm dark:bg-sky-500 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
            >
              <Terminal className="h-3.5 w-3.5" /> Consola Logs
            </button>
            <button
              onClick={() => setViewMode("reports")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === "reports" ? "bg-white text-sky-600 shadow-sm dark:bg-sky-500 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
            >
              <ClipboardList className="h-3.5 w-3.5" /> Informe Ejecutivo
            </button>
          </div>
        </div>

        {viewMode === "graphs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LoadTestDashboard key={testSessionId} liveMetrics={liveMetrics} testEndpoints={testEndpoints} isRunning={running} />
          </motion.div>
        )}

        {viewMode === "logs" && (
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400 shadow-inner dark:border-emerald-500/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-500 text-[10px] dark:border-emerald-500/10">
              <span className="flex items-center gap-1">STDOUT — CONSOLA DE SALIDA {selectedTool?.toUpperCase()}</span>
            <div className="flex items-center gap-2">
                <button onClick={() => setFontSize(prev => Math.min(prev + 2, 24))} className="hover:text-white"><ZoomIn className="h-3.5 w-3.5" /></button>
                <button onClick={() => setFontSize(prev => Math.max(prev - 2, 8))} className="hover:text-white"><ZoomOut className="h-3.5 w-3.5" /></button>
                <button onClick={() => setIsTranslated(!isTranslated)} className="hover:text-white" title="Traducir Logs">
                    <Globe className="h-3.5 w-3.5" />
                </button>
                <span className="animate-pulse h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            </div>
            <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>{isTranslated ? translateLog(activeLogs['api'] || "") : (activeLogs['api'] || "[SISTEMA] Esperando ejecución para capturar logs...")}</pre>
          </div>
        )}

        {viewMode === "reports" && (
          <div className="space-y-6">
            {showSkeletons ? (
              <div className="space-y-6 animate-pulse">
                <div className="rounded-xl border border-slate-200 bg-slate-100/50 p-5 dark:border-white/5 dark:bg-slate-950/20 h-48 flex flex-col justify-between">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                  </div>
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/4 self-end" />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white dark:border-white/5 dark:bg-slate-950/30 overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 h-12 border-b border-slate-200 dark:border-white/5" />
                  <div className="p-4 space-y-4">
                    <div className="h-8 bg-slate-100 dark:bg-slate-900 rounded" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-900 rounded" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-900 rounded" />
                  </div>
                </div>
              </div>
            ) : testEndpoints.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 dark:border-white/5 dark:bg-slate-950/20 dark:text-slate-500 text-sm">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                No hay reportes listos. Ejecuta las pruebas para analizar todo el comportamiento del ecosistema.
              </div>
            ) : (
              <>
                {/* REPORTE GLOBAL CONSOLIDADO */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 relative dark:border-white/5 dark:bg-slate-950/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4 mb-4">
                    <div>
                      <h3 className="text-md font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-sky-500" /> Resumen General Ejecutivo
                      </h3>
                      <p className="text-[11px] text-slate-400">Consolidado completo y auditoría global de la infraestructura.</p>
                    </div>
                    <button
                      onClick={downloadGeneralPDF}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-bold tracking-wide transition-all border border-slate-200 shadow-sm dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10"
                    >
                      <Download className="h-3.5 w-3.5 text-sky-500" /> DESCARGAR INFORME GENERAL (PDF)
                    </button>
                  </div>
                  <GeneralSummaryReport reportData={{
                    tool: selectedTool,
                    totalEndpoints: generalReportData.summary.totalEndpoints,
                    overallAvgLatency: generalReportData.summary.avgLatency,
                    overallSuccessRate: _overallSuccessRate,
                    totalRequests: _totalRequests || (results?.api as any)?.totalRequests || 0,
                    endpoints: generalReportData.endpoints,
                    logs: activeLogs['api'] || "",
                    rawOutput: (results?.api as any)?.rawOutput,
                    percentiles: (results?.api as any)?.percentiles || (displayEndpoints.length > 0 ? {
                      p50: Math.round(displayEndpoints.reduce((s, e) => s + (e.p50 || 0), 0) / Math.max(1, displayEndpoints.length)),
                      p95: Math.round(displayEndpoints.reduce((s, e) => s + (e.p95 || 0), 0) / Math.max(1, displayEndpoints.length)),
                      p99: Math.round(displayEndpoints.reduce((s, e) => s + (e.p99 || 0), 0) / Math.max(1, displayEndpoints.length)),
                    } : undefined),
                  }} />
                </div>

                {/* TABLA DE MÉTRICAS AVANZADAS INTEGRADA */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-white/5 dark:bg-slate-950/30">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 dark:bg-slate-950/50 dark:border-white/5">
                    <HeartPulse className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Cuadro Clínico del Sistema (SLA Matrix)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold dark:border-white/5 dark:bg-slate-900/40 dark:text-slate-400">
                          <th className="p-3">Target Endpoint</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Succ %</th>
                          <th className="p-3">Avg Latency</th>
                          <th className="p-3">p50 / p95 / p99</th>
                          <th className="p-3">RPS Est.</th>
                          <th className="p-3">Éxito / Fallo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono dark:divide-white/5">
                        {displayEndpoints.map((ep) => {
                          const total = ep.totalReqs || 0;
                          const duration = ep.configSnapshot?.duration || newConfig.duration || 1;
                          const successRate = total ? Math.round(((ep.successCount || 0) / total) * 100) : 0;

                          return (
                            <tr key={ep.id} className="hover:bg-slate-50 transition-colors dark:hover:bg-white/2">
                              <td className="p-3 flex items-center gap-2 max-w-xs md:max-w-md truncate">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                                <span className="text-slate-700 dark:text-slate-300 truncate">{ep.endpoint}</span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ep.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                  {ep.status === 'error' ? 'FALLIDO' : 'EXITOSO'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400 font-bold">{successRate}%</td>
                              <td className="p-3 text-slate-900 font-bold dark:text-slate-200">{(typeof ep.latency === 'object' ? (ep.latency as any)?.avg : ep.latency)?.toFixed(2) ?? 0} ms</td>
                              <td className="p-3 text-slate-500 dark:text-slate-400">{ep.p50 ?? 0} / {ep.p95 ?? 0} / {ep.p99 ?? 0}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">{total ? Math.round(total / duration) : 0} rps</td>
                              <td className="p-3">
                                <div className="flex gap-2">
                                  <span className="text-emerald-600 font-semibold">{ep.successCount || 0} OK</span>
                                  <span className="text-red-500 font-semibold">{ep.failCount || 0} ERR</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NUEVA SECCIÓN: DETALLE TÉCNICO AVANZADO - ESTILO ENTERPRISE */}
                <div className="mt-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Análisis Detallado por Endpoint
                    </h3>
                    <span className="text-xs text-slate-400">Total: {displayEndpoints.length} endpoints analizados</span>
                  </div>

                  <div className="grid gap-6">
                    {displayEndpoints.map((ep) => (
                      <div key={ep.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-white/5 dark:bg-slate-900/50">
                        <div className={`absolute left-0 top-0 h-full w-1.5 ${ep.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />

                        <div className="p-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleExpand(ep.id)}>
                              {expandedEndpoints[ep.id] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                              <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                              <h4 className="text-base font-bold text-slate-900 dark:text-white font-mono break-all max-w-[60%]">{ep.endpoint}</h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${ep.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                {ep.status === 'error' ? 'FALLIDO' : 'EXITOSO'}
                              </span>
                            </div>
                            <button
                              onClick={() => downloadEndpointPDF(ep)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              <Download className="h-3.5 w-3.5" /> PDF
                            </button>
                          </div>

                          <AnimatePresence>
                            {expandedEndpoints[ep.id] && (
                              <motion.div
                                id={"endpoint-detail-" + ep.id}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5 space-y-6">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40">
                                      <p className="text-[10px] uppercase font-bold text-slate-500">Latencia</p>
                                      <p className="text-xl font-bold text-slate-900 dark:text-white">{(typeof ep.latency === 'object' ? (ep.latency as any)?.avg : ep.latency)?.toFixed(2) ?? 0} <span className="text-sm text-slate-400">ms</span></p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40">
                                      <p className="text-[10px] uppercase font-bold text-slate-500">Tasa de Éxito</p>
                                      <p className="text-xl font-bold text-slate-900 dark:text-white">{ep.totalReqs ? Math.round(((ep.successCount || 0) / ep.totalReqs) * 100) : 0}%</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40">
                                      <p className="text-[10px] uppercase font-bold text-slate-500">Peticiones</p>
                                      <p className="text-xl font-bold text-slate-900 dark:text-white">{ep.totalReqs}</p>
                                    </div>
                                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950/40">
                                      <p className="text-[10px] uppercase font-bold text-slate-500">Tiempo</p>
                                      <p className="text-xl font-bold text-slate-900 dark:text-white">{ep.duration ?? 0} <span className="text-sm text-slate-400">s</span></p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                                    <div className="space-y-2">
                                      <p className="text-slate-500 font-medium">Headers enviados:</p>
                                      <pre className="h-32 overflow-auto bg-slate-950 p-4 rounded-xl text-sky-400">
                                        {JSON.stringify(ep.headers || {}, null, 2)}
                                      </pre>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-slate-500 font-medium">Payload Body (Enviado):</p>
                                      <pre className="h-32 overflow-auto bg-slate-950 p-4 rounded-xl text-amber-400">
                                        {ep.requestBody || "No hay body"}
                                      </pre>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                      <div className="flex items-center justify-between">
                                        <p className="text-slate-500 font-medium">Respuesta recibida (Último muestreo):</p>
                                        {ep.responseBody && (
                                          <span className="text-[10px] text-slate-500 font-mono">
                                            {(() => {
                                              const formatJson = (data: any) => {
                                                try {
                                                  let obj = typeof data === 'string' ? JSON.parse(data) : data;
                                                  if (typeof obj === 'string') obj = JSON.parse(obj);
                                                  return JSON.stringify(obj, null, 4);
                                                } catch {
                                                  return typeof data === 'string' ? data : JSON.stringify(data, null, 4);
                                                }
                                              };
                                              const formatted = formatJson(ep.responseBody);
                                              const sizeKB = (new Blob([formatted]).size / 1024).toFixed(3);
                                              const lines = formatted.split('\n').length;
                                              return `View raw JSON (${sizeKB} kB, ${lines} lines)`;
                                            })()}
                                          </span>
                                        )}
                                      </div>
                                      <pre className="h-64 min-h-50 resize-none overflow-y-auto overflow-x-hidden bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-xs whitespace-pre-wrap w-full border border-slate-800">
                                        {(() => {
                                          const resp = ep.responseBody;
                                          if (!resp) return "Esperando respuesta del servidor...";

                                          const formatRaw = (data: any) => {
                                            if (typeof data !== 'string') return JSON.stringify(data, null, 4);
                                            try {
                                              let obj = JSON.parse(data);
                                              if (typeof obj === 'string') obj = JSON.parse(obj);
                                              return JSON.stringify(obj, null, 4);
                                            } catch {
                                              return data
                                                .replace(/([\{\}\[\]\,])/g, '$1\n')
                                                .split('\n')
                                                .map((line: string) => line.trim())
                                                .filter(Boolean)
                                                .join('\n');
                                            }
                                          };
                                          return formatRaw(resp);
                                        })()}
                                      </pre>
                                    </div>
                                    <div className="space-y-2 col-span-2 mt-4">
                                      <p className="text-slate-500 font-medium">Estadísticas por Etiqueta (Request Label Stats):</p>
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left text-slate-300">
                                          <thead className="bg-slate-800 text-slate-400">
                                            <tr>
                                              <th className="px-3 py-2">Label</th>
                                              <th className="px-3 py-2">Status</th>
                                              <th className="px-3 py-2">Success</th>
                                              <th className="px-3 py-2">Avg RT (s)</th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-slate-950">
                                            <tr>
                                              <td className="px-3 py-2 font-mono truncate">{ep.endpoint}</td>
                                              <td className="px-3 py-2 text-emerald-400">OK</td>
                                              <td className="px-3 py-2">100.00%</td>
                                              <td className="px-3 py-2">{((typeof ep.latency === 'object' ? (ep.latency as any)?.avg : ep.latency) ?? 0) / 1000}s</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* MODAL MODERNO INTERACTIVO DE CARGA */}
      {showLoadingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" />
          <div className="relative transform overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl transition-all dark:border-white/10 dark:bg-slate-900 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 relative">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500 dark:border-emerald-400 animate-spin duration-100 " />
              <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ejecutando Batería de Pruebas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Inyectando carga masiva de peticiones distribuidas y recalculando umbrales de latencia crítica. Por favor, mantenga esta ventana activa.
              </p>
            </div>
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse" style={{ width: `${progress}%` }} />
            </div>

            <button
              onClick={() => setShowLoadingModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

        {/* MODAL INSPECCIÓN */}
        {inspectingEndpoint && (
            <InspectionModal 
              endpoint={inspectingEndpoint} 
              tool={selectedTool} 
              onClose={() => setInspectingEndpoint(null)} 
            />
        )}
    </div>
  );
}