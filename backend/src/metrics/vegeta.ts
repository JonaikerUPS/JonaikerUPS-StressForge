import { ToolMetrics } from './types';

export const parseVegeta = (logContent: string): ToolMetrics => {
  // Actual vegeta report format:
  // Requests      [total, rate, throughput]         15, 5.36, 5.35
  // Latencies     [min, mean, 50, 90, 95, 99, max]  1.091ms, 1.336ms, 1.302ms, 1.434ms, 2.201ms, 2.456ms, 2.456ms
  // Success       [ratio]                           100.00%

  const reqLine = logContent.match(/\[total,\s*rate,\s*throughput\]\s+([\d.]+),\s+([\d.]+),\s+([\d.]+)/);
  const totalRequests = reqLine ? parseFloat(reqLine[1]) : 0;
  const rps = reqLine ? parseFloat(reqLine[2]) : 0;

  const latLine = logContent.match(/\[min,\s*mean,\s*50,\s*90,\s*95,\s*99,\s*max\]\s+([\d.]+)\w*,\s+([\d.]+)\w*,\s+([\d.]+)\w*,\s+([\d.]+)\w*,\s+([\d.]+)\w*,\s+([\d.]+)\w*,\s+([\d.]+)\w*/);
  const avg = latLine ? parseFloat(latLine[2]) : 0;
  const p50 = latLine ? parseFloat(latLine[3]) : undefined;
  const p95 = latLine ? parseFloat(latLine[5]) : undefined;
  const p99 = latLine ? parseFloat(latLine[6]) : undefined;

  const successMatch = logContent.match(/Success\s+\[ratio\]\s+([\d.]+)%/);
  const successRate = successMatch ? parseFloat(successMatch[1]) : 100;
  const successCount = Math.round(totalRequests * (successRate / 100));
  const failCount = totalRequests - successCount;

  return {
    rps,
    latency: { avg, p50, p95, p99 },
    totalRequests: Math.round(totalRequests),
    successCount,
    failCount,
    errorRate: 100 - successRate,
  };
};
