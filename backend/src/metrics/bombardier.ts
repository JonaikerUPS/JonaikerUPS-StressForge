import { ToolMetrics } from './types';

export const parseBombardier = (logContent: string): ToolMetrics => {
  // Actual bombardier output:
  // Statistics        Avg      Stdev        Max
  //   Reqs/sec       404.34     178.40    1053.90
  //   Latency       12.41ms     6.83ms    58.37ms
  //  2xx - 1221, ...

  const rpsMatch = logContent.match(/Reqs\/sec\s+([\d.]+)/);
  // Match Latency row specifically to avoid matching Reqs/sec's Avg
  const avgMatch = logContent.match(/Latency\s+([\d.]+)ms/);
  const totalReqMatch = logContent.match(/2xx\s*-\s*(\d+)/);
  const totalRequests = totalReqMatch ? parseInt(totalReqMatch[1]) : 0;

  return {
    rps: rpsMatch ? parseFloat(rpsMatch[1]) : 0,
    latency: {
      avg: avgMatch ? parseFloat(avgMatch[1]) : 0,
      p50: undefined,
      p95: undefined,
      p99: undefined,
    },
    totalRequests,
    successCount: totalRequests,
    failCount: 0,
    errorRate: 0,
  };
};
