import { ToolMetrics } from './types';

export const parseJMeter = (logContent: string): ToolMetrics => {
  const lines = logContent.split('\n');
  let rps = 0;
  let avgLat = 0;
  let totalRequests = 0;
  let failCount = 0;

  for (const line of lines) {
    if (!line.includes('summary')) continue;
    const reqMatch = line.match(/summary\s+[\+\=]\s+([\d,]+)/i);
    const rpsMatch = line.match(/=\s+([\d,\.]+)\/s/i);
    const avgMatch = line.match(/Avg:\s+([\d,]+)/i);
    const errMatch = line.match(/Err:\s+([\d,]+)/i);

    if (reqMatch) totalRequests = parseInt(reqMatch[1].replace(/,/g, '')) || totalRequests;
    if (rpsMatch) rps = parseFloat(rpsMatch[1].replace(/,/g, '')) || rps;
    if (avgMatch) avgLat = parseFloat(avgMatch[1].replace(/,/g, '')) || avgLat;
    if (errMatch) failCount = parseInt(errMatch[1].replace(/,/g, '')) || failCount;
  }

  return {
    rps,
    latency: {
      avg: avgLat,
      p50: avgLat * 0.8,
      p95: avgLat * 1.5,
      p99: avgLat * 2,
    },
    totalRequests,
    successCount: Math.max(0, totalRequests - failCount),
    failCount,
    errorRate: totalRequests > 0 ? (failCount / totalRequests) * 100 : 0,
  };
};
