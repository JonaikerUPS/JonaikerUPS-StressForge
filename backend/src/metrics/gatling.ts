import { ToolMetrics } from './types';

export const parseGatling = (logContent: string): ToolMetrics => {
  // Gatling 3.14 output format (from Global Information section):
  // > request count                                          |     X |     Y |     -
  // > mean response time (ms)                                |    28 |    28 |     -
  // > response time 50th percentile (ms)                     |    28 |    28 |     -
  // > response time 95th percentile (ms)                     |    28 |    28 |     -
  // > mean throughput (rps)                                  |     1 |     1 |     -

  const reqCountMatch = logContent.match(/request count\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)?/);
  const totalRequests = reqCountMatch ? parseInt(reqCountMatch[1]) : 0;
  const successCount = reqCountMatch ? parseInt(reqCountMatch[2]) : 0;
  const failStr = reqCountMatch ? reqCountMatch[3] : '0';
  const failCount = failStr ? parseInt(failStr) : 0;

  const avgMatch = logContent.match(/mean response time \(ms\)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\S+)?/);
  const avg = avgMatch ? parseFloat(avgMatch[1]) : 0;

  const p50Match = logContent.match(/50th percentile \(ms\)\s*\|\s*(\d+)/);
  const p95Match = logContent.match(/95th percentile \(ms\)\s*\|\s*(\d+)/);
  const p99Match = logContent.match(/99th percentile \(ms\)\s*\|\s*(\d+)/);

  const rpsMatch = logContent.match(/mean throughput \(rps\)\s*\|\s*([\d.]+)/);
  const rps = rpsMatch ? parseFloat(rpsMatch[1]) : 0;

  return {
    rps,
    latency: {
      avg,
      p50: p50Match ? parseFloat(p50Match[1]) : undefined,
      p95: p95Match ? parseFloat(p95Match[1]) : undefined,
      p99: p99Match ? parseFloat(p99Match[1]) : undefined,
    },
    totalRequests,
    successCount,
    failCount,
    errorRate: totalRequests > 0 ? (failCount / totalRequests) * 100 : 0,
  };
};
