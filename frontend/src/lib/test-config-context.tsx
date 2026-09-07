"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type TestTool = "jmeter" | "locust" | "k6" | "artillery" | "taurus" | "hey" | "autocannon";
export type ToolOption = TestTool | "all" | "simulacion";

interface TestConfigContextType {
  intervalMs: number;
  setIntervalMs: (ms: number) => void;
  selectedTool: ToolOption;
  setSelectedTool: (tool: ToolOption) => void;
  backendUrl: string;
  config: Record<string, any>;
  setConfig: (config: Record<string, any>) => void;
  updateConfig: (key: string, value: any) => void;
}

const TestConfigContext = createContext<TestConfigContextType | null>(null);

const INTERVAL_KEY = "test-interval-ms";
const TOOL_KEY = "test-tool";

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

export function TestConfigProvider({ children }: { children: ReactNode }) {
  const [intervalMs, setIntervalMs] = useState<number>(() => loadInterval());
  const [selectedTool, setSelectedTool] = useState<ToolOption>(() => loadTool() as ToolOption);
  const [config, setConfig] = useState<Record<string, any>>({});

  // Reset config on tool change
  useEffect(() => {
    setConfig({});
  }, [selectedTool]);

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

  const backendUrl = "http://localhost:4000";

  return (
    <TestConfigContext.Provider value={{ 
      intervalMs, 
      setIntervalMs: setAndPersistInterval, 
      selectedTool, 
      setSelectedTool: setAndPersistTool, 
      backendUrl,
      config,
      setConfig,
      updateConfig
    }}>
      {children}
    </TestConfigContext.Provider>
  );
}

export function useTestConfig() {
  const ctx = useContext(TestConfigContext);
  if (!ctx) {
    console.warn("useTestConfig used outside provider, returning default");
    return {
      intervalMs: 2000,
      setIntervalMs: () => {},
      selectedTool: "k6" as ToolOption,
      setSelectedTool: () => {},
      backendUrl: "http://localhost:4000",
      config: {},
      setConfig: () => {},
      updateConfig: () => {}
    };
  }
  return ctx;
}
