
export interface LiveMetrics {
  latency: { avg: number; p95: number };
  errorRate: number;
  throughput: number;
  concurrency: number;
  successful: number;
  failed: number;
  ttfb?: number;
}

export function parseRawLogLine(toolName: string, chunk: string): Partial<LiveMetrics> | null {
    const line = chunk.trim();
    if (!line) return null;

    let metrics: Partial<LiveMetrics> = {};

    switch (toolName.toLowerCase()) {
        case 'taurus':
            // "Current: 10 vu  159 succ  0 fail  0.062 avg rt"
            const taurusMatch = line.match(/Current:\s+(\d+)\s+vu\s+(\d+)\s+succ\s+(\d+)\s+fail\s+([\d.]+)\s+avg rt/i);
            if (taurusMatch) {
                const successful = parseInt(taurusMatch[2]);
                const failed = parseInt(taurusMatch[3]);
                const total = successful + failed;
                metrics = {
                    concurrency: parseInt(taurusMatch[1]),
                    successful,
                    failed,
                    latency: { avg: parseFloat(taurusMatch[4]) * 1000, p95: 0 },
                    errorRate: total > 0 ? (failed / total) * 100 : 0
                };
            }
            break;
        case 'k6':
            // "10/10 VUs, 2330 complete"
            const k6Match = line.match(/(\d+)\/(\d+)\s+VUs,\s+(\d+)\s+complete/i);
            if (k6Match) {
                metrics = {
                    concurrency: parseInt(k6Match[1]),
                    successful: parseInt(k6Match[3]),
                };
            }
            break;
    }
    
    return Object.keys(metrics).length > 0 ? metrics : null;
}
