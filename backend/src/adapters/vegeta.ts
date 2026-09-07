import { ToolAdapter } from "./base-adapter";
import { UnifiedMetrics } from "../types/metrics";

export class VegetaAdapter implements ToolAdapter {
  parse(rawOutput: string): UnifiedMetrics | null {
    const lines = rawOutput.split('\n');
    let avgLatency = 0;
    let count = 0;
    let errors = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line);
        if (data.latencies) {
           avgLatency += (data.latencies.read / 1000000);
           count++;
           if (!(data.status >= 200 && data.status < 300)) errors++;
        }
      } catch {}
    }
    
    if (count === 0) return null;

    return {
        tool: 'vegeta',
        timestamp: Date.now(),
        latency: { avg: avgLatency / count, p50: avgLatency / count, p95: avgLatency / count, p99: avgLatency / count }, 
        throughput: count, 
        errorRate: (errors / count) * 100,
        cpuUsage: 0,
        ramUsage: 0,
        totalRequests: count,
        successCount: count - errors,
        failCount: errors,
    };
  }
}
