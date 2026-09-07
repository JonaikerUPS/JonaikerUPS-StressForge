"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { useSocket } from "./socket-context";
import { getBackendUrl } from '@/lib/api-url';

export interface ApiEndpointResult {
  url: string;
  method: string;
  latency: number;
  avgLatency?: number;
  status: "success" | "error";
  totalRequests?: number;
  successful?: number;
  failed?: number;
  p50?: number;
  p95?: number;
  p99?: number;
  throughput?: number;
  percentiles?: Record<string, number>;
}
export interface ApiTestResult { endpoints: ApiEndpointResult[]; avgLatency: number; successRate: number; totalRequests: number; throughput: number; percentiles?: Record<string, number>; rawOutput?: string; }
export interface WsTestResult { messagesSent: number; messagesReceived: number; avgLatency: number; latencyHistory: number[]; }
export interface DbTestResult { queryCount: number; avgDuration: number; durationHistory: number[]; }
export interface LoadTestResult { maxConcurrent: number; avgResponseTime: number; totalRequests: number; errorRate: number; }
export interface NetworkTestResult { avgLatency: number; packetLoss: number; latencyHistory: number[]; }
export interface CacheTestResult { hits: number; misses: number; hitRate: number; }
export interface SecurityTestResult { totalAttempts: number; blocked: number; allowed: number; toolMetrics: Record<string, any>; }
export interface FileTestResult { totalTransfers: number; avgSpeed: number; totalSize: number; }

export interface TestResults {
  api: ApiTestResult | null;
  websocket: WsTestResult | null;
  database: DbTestResult | null;
  load: LoadTestResult | null;
  network: NetworkTestResult | null;
  cache: CacheTestResult | null;
  security: SecurityTestResult | null;
  files: FileTestResult | null;
  system: { cpu: number; ram: number } | null;
}

type TestCategory = keyof TestResults;

interface TestResultsContextType {
  results: TestResults;
  activeLogs: Record<string, string>;
  setActiveLogs: (category: string, log: string | ((prev: string) => string)) => void;
  isTestRunning: Record<string, boolean>;
  setIsTestRunning: (category: string, running: boolean) => void;
  showLoadingModal: boolean;
  setShowLoadingModal: Dispatch<SetStateAction<boolean>>;
  publishApiResults: (r: ApiTestResult) => void;
  publishWsResults: (r: WsTestResult) => void;
  publishDbResults: (r: DbTestResult) => void;
  publishLoadResults: (r: LoadTestResult) => void;
  publishNetworkResults: (r: NetworkTestResult) => void;
  publishCacheResults: (r: CacheTestResult) => void;
  publishSecurityResults: (r: SecurityTestResult) => void;
  publishFileResults: (r: FileTestResult) => void;
  clearResults: (category?: TestCategory) => void;
}

const emptyResults: TestResults = { api: null, websocket: null, database: null, load: null, network: null, cache: null, security: null, files: null, system: null };
const BACKEND_URL = getBackendUrl();
const LS_KEY = "stressforge_test_results";
const TestResultsContext = createContext<TestResultsContextType | null>(null);

// ── localStorage helpers ───────────────────────────────────────────────
function saveToLS(r: TestResults) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), data: r }));
    }
  } catch { /* quota or SSR */ }
}

function loadFromLS(): TestResults | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 24 h
    if (Date.now() - (parsed.ts || 0) > 86_400_000) return null;
    return parsed.data as TestResults;
  } catch { return null; }
}

function getAuthToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const auth = localStorage.getItem("admin-auth");
    return auth ? JSON.parse(auth).token : null;
  } catch { return null; }
}

// Converts raw DB TestResult documents into ApiTestResult shape
function dbResultsToApiResult(docs: any[]): ApiTestResult | null {
    if (!docs || docs.length === 0) return null;
    const apiDocs = docs.filter((d: any) => d.category === 'API' || !d.category);
    if (apiDocs.length === 0) return null;

    // Group by endpoint url to keep the newest result per endpoint
    const endpointMap = new Map<string, any>();
    for (const d of apiDocs) {
        const key = (d.endpoint || '').trim().toLowerCase();
        if (!key) continue;
        if (!endpointMap.has(key)) {
            endpointMap.set(key, d);
        }
    }

    const latestDocs = endpointMap.size > 0 ? Array.from(endpointMap.values()) : apiDocs.slice(0, 10);

    const totalRequests = latestDocs.reduce((s: number, d: any) => s + (d.metrics?.totalRequests || 0), 0);
    const successCount  = latestDocs.reduce((s: number, d: any) => s + (d.metrics?.successCount || 0), 0);
    const avgLatency    = latestDocs.reduce((s: number, d: any) => s + (d.metrics?.latency?.avg || 0), 0) / Math.max(1, latestDocs.length);
    const throughput    = latestDocs.reduce((s: number, d: any) => s + (d.metrics?.rps || 0), 0);
    const successRate   = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 100;
    const p95 = latestDocs.reduce((s: number, d: any) => s + (d.metrics?.latency?.p95 || 0), 0) / Math.max(1, latestDocs.length);
    const p99 = latestDocs.reduce((s: number, d: any) => s + (d.metrics?.latency?.p99 || 0), 0) / Math.max(1, latestDocs.length);

    const endpoints: ApiEndpointResult[] = latestDocs.map((d: any) => ({
        url: d.endpoint || '',
        method: d.method || 'GET',
        latency: d.metrics?.latency?.avg || 0,
        avgLatency: d.metrics?.latency?.avg || 0,
        status: (d.metrics?.failCount || 0) > (d.metrics?.successCount || 0) ? 'error' : 'success',
        totalRequests: d.metrics?.totalRequests || 0,
        successful: d.metrics?.successCount || 0,
        failed: d.metrics?.failCount || 0,
        p50: d.metrics?.latency?.p50 || d.metrics?.latency?.avg || 0,
        p95: d.metrics?.latency?.p95 || 0,
        p99: d.metrics?.latency?.p99 || 0,
        throughput: d.metrics?.rps || 0,
        percentiles: { p50: d.metrics?.latency?.p50 || 0, p95: d.metrics?.latency?.p95 || 0, p99: d.metrics?.latency?.p99 || 0 },
    }));

    return { endpoints, avgLatency, successRate, totalRequests, throughput, percentiles: { p50: avgLatency * 0.8, p95, p99 } };
}

// Converts raw DB TestResult documents into all module result shapes
function dbResultsToAllResults(docs: any[]): TestResults {
    const results: TestResults = { ...emptyResults };
    
    // Map API
    results.api = dbResultsToApiResult(docs);

    // Map other categories
    const categories: TestCategory[] = ['websocket', 'database', 'load', 'network', 'cache', 'security', 'files'];
    
    categories.forEach(cat => {
        const catDocs = docs.filter(d => d.category === cat.toUpperCase());
        if (catDocs.length === 0) return;
        
        // Taking the newest one (index 0)
        const d = catDocs[0];
        
        if (cat === 'websocket') {
            results.websocket = {
                messagesSent: d.metrics?.messagesSent || 0,
                messagesReceived: d.metrics?.messagesReceived || 0,
                avgLatency: d.metrics?.avgLatency || 0,
                latencyHistory: d.metrics?.latencyHistory || [],
            };
        } else if (cat === 'database') {
            results.database = {
                queryCount: d.metrics?.queryCount || 0,
                avgDuration: d.metrics?.avgDuration || 0,
                durationHistory: d.metrics?.durationHistory || [],
            };
        } else if (cat === 'load') {
            results.load = {
                maxConcurrent: d.metrics?.maxConcurrent || 0,
                avgResponseTime: d.metrics?.avgResponseTime || 0,
                totalRequests: d.metrics?.totalRequests || 0,
                errorRate: d.metrics?.errorRate || 0,
            };
        } else if (cat === 'network') {
            results.network = {
                avgLatency: d.metrics?.avgLatency || 0,
                packetLoss: d.metrics?.packetLoss || 0,
                latencyHistory: d.metrics?.latencyHistory || [],
            };
        } else if (cat === 'cache') {
            results.cache = {
                hits: d.metrics?.hits || 0,
                misses: d.metrics?.misses || 0,
                hitRate: d.metrics?.hitRate || 0,
            };
        } else if (cat === 'files') {
            results.files = {
                totalTransfers: d.metrics?.totalTransfers || 0,
                avgSpeed: d.metrics?.avgSpeed || 0,
                totalSize: d.metrics?.totalSize || 0,
            };
        } else if (cat === 'security') {
            results.security = {
                totalAttempts: d.metrics?.totalAttempts || 0,
                blocked: d.metrics?.blocked || 0,
                allowed: d.metrics?.allowed || 0,
                toolMetrics: d.metrics?.toolMetrics || {},
            };
        }
    });

    return results;
}

export function TestResultsProvider({ children }: { children: ReactNode }) {
  // Hydrate immediately from localStorage so the UI is never blank on reload
  const [results, setResults] = useState<TestResults>(() => loadFromLS() ?? emptyResults);
  const [activeLogs, setActiveLogs] = useState<Record<string, string>>({});
  const [isTestRunning, setIsTestRunning] = useState<Record<string, boolean>>({});
  const [showLoadingModal, setShowLoadingModal] = useState<boolean>(false);
  const socket = useSocket();
  const hydratedFromDB = useRef(false);

  // Persist to localStorage whenever results change
  useEffect(() => {
    console.log("[DEBUG] Saving to LS:", results);
    saveToLS(results);
  }, [results]);

    // On mount: fetch latest from DB and update state (silent background hydration)
    useEffect(() => {
        if (hydratedFromDB.current) return;
        hydratedFromDB.current = true;

        const token = getAuthToken();
        if (!token) return;

        console.log("[DEBUG] Fetching latest results from DB...");
        fetch(`${BACKEND_URL}/api/tests/results/latest`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
                return r.json();
            })
            .catch((err) => { 
                console.error("[DEBUG] Error fetching from DB:", err); 
                return null; 
            })
            .then((docs: any[] | null) => {
                if (!docs) return;
                const hydratedResults = dbResultsToAllResults(docs);
                console.log("[DEBUG] Hydrated All Results successfully.");
                setResults(prev => ({ ...prev, ...hydratedResults }));
            });
    }, []);

  const handleSetActiveLogs = useCallback((category: string, log: string | ((prev: string) => string)) => {
      setActiveLogs(prev => {
          const currentLog = prev[category] || "";
          const newLog = typeof log === 'function' ? log(currentLog) : currentLog + log;
          return { ...prev, [category]: newLog };
      });
  }, []);

  const handleSetIsTestRunning = useCallback((category: string, running: boolean) => {
      setIsTestRunning(prev => ({ ...prev, [category]: running }));
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    socket.on("test-started", (data: any) => {
        const category = data.type || 'api';
        handleSetIsTestRunning(category, true);
        if (category === 'api') setShowLoadingModal(true);
        handleSetActiveLogs(category, `[SISTEMA] Prueba ${category} iniciada...\n`);
    });
    
    socket.on("test-suite-complete", (data: any) => {
        const category = data.testType || 'api';
        handleSetIsTestRunning(category, false);
        if (category === 'api') setShowLoadingModal(false);
        handleSetActiveLogs(category, `[SISTEMA] Prueba ${category} completada.\n`);
    });

    socket.on("test-update", (data: any) => {
        const category = data.testType || 'api';
        if (data.type === "log" && data.log) {
            handleSetActiveLogs(category, `[${data.tool}] ${data.log}\n`);
        }
        
        if (data.type === "metrics" && data.data) {
            const m = data.data;
            if (category === 'api') {
                setResults((prev: TestResults) => ({
                    ...prev,
                    api: {
                        endpoints: [],
                        avgLatency: m.latency?.avg || 0,
                        successRate: m.errorRate != null ? 100 - m.errorRate * 100 : 100,
                        totalRequests: m.totalRequests || 0,
                        throughput: m.throughput || 0,
                        percentiles: {
                            p50: m.latency?.p50 || m.latency?.avg || 0,
                            p95: m.latency?.p95 || 0,
                            p99: m.latency?.p99 || 0,
                        },
                    }
                }));
            }
        }
    });

    socket.on("test-data", (data: any) => {
        console.log("[DEBUG] Received test-data event:", data);
        if (!data) return;
        const category = data.testType || 'api';
        if (data.type === "complete") {
            console.log("[DEBUG] Processing complete data for category:", category);
            handleSetActiveLogs(category, (data.rawOutput || "[SISTEMA] Resultados recibidos\n"));
            
            if (category === 'api' || category === 'stress') {
                const endpointsList: ApiEndpointResult[] = (data.endpoints || []).map((ep: any) => ({
                    url: ep.url,
                    latency: ep.avgLatency || ep.latency || 0,
                    avgLatency: ep.avgLatency || ep.latency || 0,
                    status: (ep.status === "error" ? "error" : "success") as "success" | "error",
                    method: ep.method || "GET",
                    totalRequests: ep.totalRequests || 0,
                    successful: ep.successful || ep.successCount || 0,
                    failed: ep.failed || ep.failCount || 0,
                    p50: ep.p50 || ep.percentiles?.p50 || 0,
                    p95: ep.p95 || ep.percentiles?.p95 || 0,
                    p99: ep.p99 || ep.percentiles?.p99 || 0,
                    throughput: ep.throughput || 0,
                    percentiles: ep.percentiles || { p50: 0, p95: 0, p99: 0 },
                }));

                // Compute aggregates from endpoint list for maximum accuracy
                const totalRequests = endpointsList.reduce((s, e) => s + (e.totalRequests || 0), 0);
                const totalSuccessful = endpointsList.reduce((s, e) => s + (e.successful || 0), 0);
                const computedAvgLatency = endpointsList.length > 0
                    ? endpointsList.reduce((s, e) => s + (e.avgLatency || e.latency || 0), 0) / endpointsList.length
                    : (data.summary?.avgLatency || 0);

                const apiResult: ApiTestResult = {
                    endpoints: endpointsList,
                    avgLatency: data.summary?.avgLatency || computedAvgLatency,
                    successRate: totalRequests > 0
                        ? Math.round((totalSuccessful / totalRequests) * 100)
                        : (data.summary?.totalRequests > 0
                            ? Math.round(((data.summary?.successful || 0) / (data.summary?.totalRequests || 1)) * 100)
                            : 100),
                    totalRequests: totalRequests || data.summary?.totalRequests || 0,
                    throughput: data.summary?.throughput || 0,
                    percentiles: data.summary?.percentiles || { p50: 0, p95: 0, p99: 0 },
                    rawOutput: data.rawOutput || "",
                };
                setResults((prev: TestResults) => ({ ...prev, api: apiResult }));
            } else if (category === 'websocket') {
                const wsRes = { 
                    messagesSent: data.summary?.messagesSent || 0,
                    messagesReceived: data.summary?.messagesReceived || 0,
                    avgLatency: data.summary?.avgLatency || 0,
                    latencyHistory: data.summary?.latencyHistory || [],
                };
                setResults((prev: TestResults) => ({ ...prev, websocket: wsRes }));
            } else if (category === 'database') {
                const dbRes = { 
                    queryCount: data.summary?.queryCount || 0,
                    avgDuration: data.summary?.avgDuration || 0,
                    durationHistory: data.summary?.durationHistory || [],
                };
                setResults((prev: TestResults) => ({ ...prev, database: dbRes }));
            } else if (category === 'load') {
                const loadRes = { 
                    maxConcurrent: data.summary?.maxConcurrent || 0,
                    avgResponseTime: data.summary?.avgResponseTime || 0,
                    totalRequests: data.summary?.totalRequests || 0,
                    errorRate: data.summary?.errorRate || 0,
                };
                setResults((prev: TestResults) => ({ ...prev, load: loadRes }));
            } else if (category === 'network') {
                const netRes = { 
                    avgLatency: data.summary?.avgLatency || 0,
                    packetLoss: data.summary?.packetLoss || 0,
                    latencyHistory: data.summary?.latencyHistory || [],
                };
                setResults((prev: TestResults) => ({ ...prev, network: netRes }));
            } else if (category === 'cache') {
                const cacheRes = { 
                    hits: data.summary?.hits || 0,
                    misses: data.summary?.misses || 0,
                    hitRate: data.summary?.hitRate || 0,
                };
                setResults((prev: TestResults) => ({ ...prev, cache: cacheRes }));
            } else if (category === 'files') {
                const filesRes = { 
                    totalTransfers: data.summary?.totalTransfers || 0,
                    avgSpeed: data.summary?.avgSpeed || 0,
                    totalSize: data.summary?.totalSize || 0,
                };
                setResults((prev: TestResults) => ({ ...prev, files: filesRes }));
            } else if (category === 'security') {
                const secRes = { 
                    totalAttempts: data.summary?.totalRequests || 0,
                    blocked: data.summary?.failed || 0,
                    allowed: data.summary?.successful || 0,
                    toolMetrics: data.metrics || {},
                };
                setResults((prev: TestResults) => ({ ...prev, security: secRes }));
            }
        }
    });

    return () => {
        socket.off("test-started");
        socket.off("test-suite-complete");
        socket.off("test-update");
        socket.off("test-data");
    };
  }, [socket, handleSetActiveLogs, handleSetIsTestRunning]);

  const clearResults = useCallback(async (category?: TestCategory) => {
    const token = getAuthToken();
    if (category) {
        if (token) {
            await fetch(`${BACKEND_URL}/api/tests/results/${category}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            }).catch(console.error);
        }
        setResults(prev => ({ ...prev, [category]: null }));
        setActiveLogs(prev => ({ ...prev, [category]: "" }));
        setIsTestRunning(prev => ({ ...prev, [category]: false }));
    } else {
        if (token) {
            await fetch(`${BACKEND_URL}/api/tests/clear`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            }).catch(console.error);
        }
        setResults(emptyResults);
        setActiveLogs({});
        setIsTestRunning({});
    }
  }, []);

  const publishResults = useCallback((category: TestCategory, data: any) => {
    setResults(prev => ({ ...prev, [category]: data }));

    // Persistir automáticamente en MongoDB
    if (typeof window !== "undefined" && data) {
      const token = getAuthToken();
      fetch(`${BACKEND_URL}/api/tests/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          category: category.toUpperCase(),
          toolName: (data as any).tool || (data as any).toolName || category,
          metrics: data,
          endpoint: (data as any).endpoint || (data as any).targetUrl || (data as any).url || '',
          method: (data as any).method || 'GET',
          logContent: (data as any).rawOutput || `Result for ${category}`
        })
      }).catch((err) => console.debug("Auto-save result failed:", err));
    }
  }, []);

  const publishApiResults = useCallback((r: ApiTestResult) => publishResults("api", r), [publishResults]);
  const publishWsResults = useCallback((r: WsTestResult) => publishResults("websocket", r), [publishResults]);
  const publishDbResults = useCallback((r: DbTestResult) => publishResults("database", r), [publishResults]);
  const publishLoadResults = useCallback((r: LoadTestResult) => publishResults("load", r), [publishResults]);
  const publishNetworkResults = useCallback((r: NetworkTestResult) => publishResults("network", r), [publishResults]);
  const publishCacheResults = useCallback((r: CacheTestResult) => publishResults("cache", r), [publishResults]);
  const publishSecurityResults = useCallback((r: SecurityTestResult) => publishResults("security", r), [publishResults]);
  const publishFileResults = useCallback((r: FileTestResult) => publishResults("files", r), [publishResults]);

  const contextValue = useMemo(() => ({
        results,
        activeLogs,
        setActiveLogs: handleSetActiveLogs,
        isTestRunning,
        setIsTestRunning: handleSetIsTestRunning,
        showLoadingModal,
        setShowLoadingModal,
        publishApiResults,
        publishWsResults,
        publishDbResults,
        publishLoadResults,
        publishNetworkResults,
        publishCacheResults,
        publishSecurityResults,
        publishFileResults,
        clearResults
    }), [results, activeLogs, isTestRunning, showLoadingModal, handleSetActiveLogs, handleSetIsTestRunning, publishApiResults, publishWsResults, publishDbResults, publishLoadResults, publishNetworkResults, publishCacheResults, publishSecurityResults, publishFileResults, clearResults]);

    return (
        <TestResultsContext.Provider value={contextValue}>
            {children}
        </TestResultsContext.Provider>
    );
}

export function useTestResults() {
  const ctx = useContext(TestResultsContext);
  if (!ctx) throw new Error("useTestResults must be used within TestResultsProvider");
  return ctx;
}
