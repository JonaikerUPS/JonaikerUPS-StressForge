export interface ToolMetrics {
  rps: number;
  latency: {
    avg: number;
    p50?: number;
    p95?: number;
    p99?: number;
  };
  totalRequests: number;
  successCount: number;
  failCount: number;
  errorRate: number;
  errorDetails?: string; // New field
  // Nuevas métricas opcionales
  concurrency?: number;
  cpu?: number;
  ram?: number;
  dbLatency?: number;
  percentiles?: Record<string, number>;
  rawOutput?: string;
}

export type MetricsParser = (logContent: string) => ToolMetrics;
