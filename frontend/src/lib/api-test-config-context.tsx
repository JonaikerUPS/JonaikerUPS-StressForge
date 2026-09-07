"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface EndpointConfig {
  id: number;
  endpoint: string;
  method: HttpMethod;
  requestBody?: string;
  concurrency?: number;
  requests?: number;
  duration?: number;
  durationUnit?: string;
  rampUp?: number;
  rampUpUnit?: string;
  headers?: Record<string, string>;
  maxLatency?: number; // SLA Latency Threshold
}

export interface StoredEndpointResult {
  id: number;
  latency: number | null;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  successCount?: number;
  failCount?: number;
  totalReqs?: number;
  minLatency?: number;
  maxLatency?: number;
}

export interface StoredTestRun {
  results: StoredEndpointResult[];
  concurrentUsers: number;
  requestCount: number;
}

interface ApiTestConfigContextType {
  endpoints: EndpointConfig[];
  lastRun: StoredTestRun | null;
  setLastRun: (run: StoredTestRun | null) => void;
  requestCount: number;
  setRequestCount: (count: number) => void;
  concurrentUsers: number;
  setConcurrentUsers: (users: number) => void;
  addEndpoint: (endpoint: string, method: HttpMethod, requestBody?: string, config?: { concurrency?: number, requests?: number, duration?: number, rampUp?: number, headers?: Record<string, string> }) => void;
  removeEndpoint: (id: number) => void;
  updateEndpoint: (id: number, updates: Partial<EndpointConfig>) => void;
  clearEndpoints: () => void;
}

const STORAGE_KEY = "api-test-config-endpoints";
const LAST_RUN_KEY = "api-test-last-run";
const REQUEST_COUNT_KEY = "api-test-request-count";
const CONCURRENT_USERS_KEY = "api-test-concurrent-users";

function loadEndpoints(): EndpointConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as EndpointConfig[];
  } catch { /* noop */ }
  return [];
}

function loadLastRun(): StoredTestRun | null {
  try {
    const stored = localStorage.getItem(LAST_RUN_KEY);
    if (stored) return JSON.parse(stored) as StoredTestRun;
  } catch { /* noop */ }
  return null;
}

function loadRequestCount(): number {
  try {
    const stored = localStorage.getItem(REQUEST_COUNT_KEY);
    if (stored) return Math.max(1, parseInt(stored, 10));
  } catch { /* noop */ }
  return 1;
}

function loadConcurrentUsers(): number {
  try {
    const stored = localStorage.getItem(CONCURRENT_USERS_KEY);
    if (stored) return Math.max(1, parseInt(stored, 10));
  } catch { /* noop */ }
  return 1;
}

const ApiTestConfigContext = createContext<ApiTestConfigContextType | null>(null);

export function ApiTestConfigProvider({ children }: { children: ReactNode }) {
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>([]);
  const [lastRun, setLastRunState] = useState<StoredTestRun | null>(null);
  const [requestCount, setRequestCount] = useState(1);
  const [concurrentUsers, setConcurrentUsers] = useState(1);

  useEffect(() => {
    setEndpoints(loadEndpoints());
    setLastRunState(loadLastRun());
    setRequestCount(loadRequestCount());
    setConcurrentUsers(loadConcurrentUsers());
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints)); } catch { /* noop */ }
  }, [endpoints]);

  useEffect(() => {
    try { localStorage.setItem(LAST_RUN_KEY, JSON.stringify(lastRun)); } catch { /* noop */ }
  }, [lastRun]);

  useEffect(() => {
    try { localStorage.setItem(REQUEST_COUNT_KEY, String(requestCount)); } catch { /* noop */ }
  }, [requestCount]);

  useEffect(() => {
    try { localStorage.setItem(CONCURRENT_USERS_KEY, String(concurrentUsers)); } catch { /* noop */ }
  }, [concurrentUsers]);

  const setLastRun = useCallback((run: StoredTestRun | null) => {
    setLastRunState(run);
  }, []);

  const addEndpoint = useCallback((endpoint: string, method: HttpMethod, requestBody?: string, config?: { concurrency?: number, requests?: number, duration?: number, rampUp?: number, headers?: Record<string, string> }) => {
    const trimmed = endpoint.trim();
    if (!trimmed) return;
    setEndpoints((prev) => [...prev, { id: Date.now(), endpoint: trimmed, method, requestBody, ...config }]);
  }, []);

  const removeEndpoint = useCallback((id: number) => {
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateEndpoint = useCallback((id: number, updates: Partial<EndpointConfig>) => {
    setEndpoints((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const clearEndpoints = useCallback(() => {
    setEndpoints([]);
  }, []);

  return (
    <ApiTestConfigContext.Provider
      value={{
        endpoints,
        lastRun,
        setLastRun,
        requestCount,
        setRequestCount: (c: number) => setRequestCount(Math.max(1, c)),
        concurrentUsers,
        setConcurrentUsers: (c: number) => setConcurrentUsers(Math.max(1, c)),
        addEndpoint,
        removeEndpoint,
        updateEndpoint,
        clearEndpoints,
      }}
    >
      {children}
    </ApiTestConfigContext.Provider>
  );
}

export function useApiTestConfig() {
  const ctx = useContext(ApiTestConfigContext);
  if (!ctx) throw new Error("useApiTestConfig must be used within ApiTestConfigProvider");
  return ctx;
}