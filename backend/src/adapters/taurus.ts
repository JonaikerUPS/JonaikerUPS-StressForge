import { ToolAdapter } from "./base-adapter";
import { UnifiedMetrics } from "../types/metrics";

export class TaurusAdapter implements ToolAdapter {
  parse(rawOutput: string): UnifiedMetrics | null {
    const samplesMatch = rawOutput.match(/Samples count: (\d+), ([\d.]+)% failures/);
    const avgRtMatch = rawOutput.match(/Average times: total ([\d.]+), latency ([\d.]+), connect ([\d.]+)/);
    
    // Parse percentiles
    const percentiles: Record<string, number> = {};
    const pLineRegex = /\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/g;
    let pMatch;
    while ((pMatch = pLineRegex.exec(rawOutput)) !== null) {
      percentiles[`p${pMatch[1]}`] = parseFloat(pMatch[2]) * 1000; // Segundos a ms
    }

    // Parse request stats
    const requestStats: any[] = [];
    const statsRegex = /(?:\[TAURUS\]\s*)?\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g;
    // Skip header lines
    let sMatch;
    let headerSkipped = false;
    while ((sMatch = statsRegex.exec(rawOutput)) !== null) {
        if (!headerSkipped) { headerSkipped = true; continue; }
        if (sMatch[1].includes('label')) continue;
        requestStats.push({
            label: sMatch[1].trim(),
            status: sMatch[2].trim(),
            success: sMatch[3].trim(),
            avg_rt: sMatch[4].trim(),
            error: sMatch[5].trim()
        });
    }

    if (!samplesMatch && !avgRtMatch) return null;

    const totalSamples = samplesMatch ? parseInt(samplesMatch[1]) : 0;
    const errorRate = samplesMatch ? parseFloat(samplesMatch[2]) : 0;
    const avgLatency = avgRtMatch ? parseFloat(avgRtMatch[2]) * 1000 : 0;

    return {
      tool: "taurus",
      timestamp: Date.now(),
      latency: { avg: avgLatency, p95: percentiles['p95'] || 0, p99: percentiles['p99'] || 0 },
      throughput: totalSamples,
      errorRate: errorRate,
      cpuUsage: 0,
      ramUsage: 0,
      percentiles,
      requestStats,
      rawOutput 
    };
  }
}