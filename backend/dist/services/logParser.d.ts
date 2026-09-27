export interface LiveMetrics {
    latency: {
        avg: number;
        p95: number;
    };
    errorRate: number;
    throughput: number;
    concurrency: number;
    successful: number;
    failed: number;
    ttfb?: number;
}
export declare function parseRawLogLine(toolName: string, chunk: string): Partial<LiveMetrics> | null;
//# sourceMappingURL=logParser.d.ts.map