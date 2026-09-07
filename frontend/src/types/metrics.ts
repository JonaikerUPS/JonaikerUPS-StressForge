export interface UnifiedMetrics {
  tool: string;
  timestamp: number;
  latency: { avg: number; p50?: number; p95: number; p99?: number };
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  ramUsage: number;
  concurrency?: number;
  duration?: number;
  totalRequests?: number;
  successCount?: number;
  failCount?: number;
  endpoints?: any[];
  rawOutput?: string;
  percentiles?: Record<string, number>;
  requestStats?: any[];
  errorDetails?: string;
}
