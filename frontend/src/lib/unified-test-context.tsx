"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type ToolOption } from "@/lib/tool-schemas";
import { type HttpMethod, type EndpointConfig, type StoredTestRun } from "@/lib/api-test-config-context";

interface UnifiedTestContextType {
  // Test Config
  intervalMs: number;
  setIntervalMs: (ms: number) => void;
  selectedTool: ToolOption;
  setSelectedTool: (tool: ToolOption) => void;
  backendUrl: string;
  config: Record<string, any>;
  setConfig: (config: Record<string, any>) => void;
  updateConfig: (key: string, value: any) => void;

  // API Test Config
  endpoints: EndpointConfig[];
  lastRuns: Record<ToolOption, StoredTestRun | null>;
  setLastRun: (tool: ToolOption, run: StoredTestRun | null) => void;
  requestCount: number;
  setRequestCount: (count: number) => void;
  concurrentUsers: number;
  setConcurrentUsers: (users: number) => void;
  addEndpoint: (endpoint: string, method: HttpMethod, requestBody?: string, config?: { concurrency?: number, requests?: number, duration?: number, rampUp?: number, headers?: Record<string, string> }) => void;
  removeEndpoint: (id: number) => void;
  updateEndpoint: (id: number, updates: Partial<EndpointConfig>) => void;
  clearEndpoints: () => void;
}

const UnifiedTestContext = createContext<UnifiedTestContextType | null>(null);

const INTERVAL_KEY = "test-interval-ms";
const TOOL_KEY = "test-tool";
const ENDPOINTS_KEY = "unified-test-endpoints";
const LAST_RUNS_KEY = "api-test-last-runs";

function loadLastRuns(): Record<ToolOption, StoredTestRun | null> {
    try {
      const stored = localStorage.getItem(LAST_RUNS_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* noop */ }
    return {} as any;
}

function loadInterval(): number {
  try {
    const stored = localStorage.getItem(INTERVAL_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!isNaN(parsed) && parsed >= 100) return parsed;
    }
  } catch { /* noop */ }
  return 2000;
}

function loadTool(): string {
  try { return localStorage.getItem(TOOL_KEY) || "k6"; } catch { return "k6"; }
}

function loadEndpoints(): EndpointConfig[] {
    try {
      const stored = localStorage.getItem(ENDPOINTS_KEY);
      if (stored) return JSON.parse(stored) as EndpointConfig[];
    } catch { /* noop */ }
    return [];
}

export function UnifiedTestProvider({ children }: { children: ReactNode }) {
  const [intervalMs, setIntervalMs] = useState<number>(() => loadInterval());
  const [selectedTool, setSelectedTool] = useState<ToolOption>(() => loadTool() as ToolOption);
  
  // API Test State
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>(() => loadEndpoints());
  const [lastRuns, setLastRuns] = useState<Record<ToolOption, StoredTestRun | null>>(() => loadLastRuns());
  const [requestCount, setRequestCount] = useState(1);
  const [concurrentUsers, setConcurrentUsers] = useState(1);
  const [config, setConfig] = useState<Record<string, any>>({});


  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const setAndPersistInterval = (ms: number) => {
    setIntervalMs(ms);
    try { localStorage.setItem(INTERVAL_KEY, String(ms)); } catch { /* noop */ }
  };

  const setAndPersistTool = (tool: ToolOption) => {
    setSelectedTool(tool);
    try { localStorage.setItem(TOOL_KEY, tool); } catch { /* noop */ }
  };

  const setLastRun = (tool: ToolOption, run: StoredTestRun | null) => {
    setLastRuns(prev => ({ ...prev, [tool]: run }));
  };

  // Reset config on tool change
  useEffect(() => {
    setConfig({});
  }, [selectedTool]);

  // Persistence for API endpoints and lastRuns
  useEffect(() => {
    try { localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(endpoints)); } catch { /* noop */ }
    try { localStorage.setItem(LAST_RUNS_KEY, JSON.stringify(lastRuns)); } catch { /* noop */ }
  }, [endpoints, lastRuns]);

  const addEndpoint = useCallback((endpoint: string, method: HttpMethod, requestBody?: string, config?: { concurrency?: number, requests?: number, duration?: number, rampUp?: number, headers?: Record<string, string> }) => {
    const trimmed = endpoint.trim();
    if (!trimmed) return;
    setEndpoints((prev) => [...prev, { id: Date.now(), endpoint: trimmed, method, requestBody, ...config }]);
  }, []);

  const removeEndpoint = useCallback((id: number) => {
    setEndpoints((prev) => {
      const next = prev.filter((e) => e.id !== id);
      return next;
    });
  }, []);

  const updateEndpoint = useCallback((id: number, updates: Partial<EndpointConfig>) => {
    setEndpoints((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
      return next;
    });
  }, []);

  const clearEndpoints = useCallback(() => {
    setEndpoints([]);
  }, []);

  const backendUrl = "http://localhost:4000";

  return (
    <UnifiedTestContext.Provider value={{ 
      intervalMs, 
      setIntervalMs: setAndPersistInterval, 
      selectedTool, 
      setSelectedTool: setAndPersistTool, 
      backendUrl,
      config,
      setConfig,
      updateConfig,
      endpoints,
      lastRuns,
      setLastRun,
      requestCount,
      setRequestCount,
      concurrentUsers,
      setConcurrentUsers,
      addEndpoint,
      removeEndpoint,
      updateEndpoint,
      clearEndpoints
    }}>
      {children}
    </UnifiedTestContext.Provider>
  );
}

export function useUnifiedTest() {
  const ctx = useContext(UnifiedTestContext);
  if (!ctx) throw new Error("useUnifiedTest must be used within UnifiedTestProvider");
  return ctx;
}
