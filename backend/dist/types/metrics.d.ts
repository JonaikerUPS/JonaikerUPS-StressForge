export interface UnifiedMetrics {
    tool: string;
    timestamp: number;
    latency: {
        avg: number;
        p95: number;
        p99: number;
    };
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    ramUsage: number;
    concurrency?: number;
    duration?: number;
    endpoints?: any[];
    rawOutput?: string;
    percentiles?: Record<string, number>;
    requestStats?: any[];
}
//# sourceMappingURL=metrics.d.ts.map