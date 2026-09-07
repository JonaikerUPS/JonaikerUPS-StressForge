import { ToolMetrics } from './types';

export const parseHey = (logContent: string): ToolMetrics => {
  // Actual hey output:
  // Average:	0.0041 secs
  // Requests/sec:	1215.8822
  // Latency distribution: (values in secs)
  //   50%% in 0.0032 secs
  //   95%% in 0.0090 secs
  //   99%% in 0.0164 secs
  // Status code distribution:
  //   [200]	3651 responses

  const rpsMatch = logContent.match(/Requests\/sec:\s+([\d.]+)/);
  const avgMatch = logContent.match(/Average:\s+([\d.]+)/);
  const p50Match = logContent.match(/50%%\s+in\s+([\d.]+)/);
  const p95Match = logContent.match(/95%%\s+in\s+([\d.]+)/);
  const p99Match = logContent.match(/99%%\s+in\s+([\d.]+)/);
  const totalReqMatch = logContent.match(/\[\d+\]\s+(\d+)\s+responses/);
  const totalRequests = totalReqMatch ? parseInt(totalReqMatch[1]) : 0;

  // hey outputs latency values in SECONDS, convert to ms
  const toMs = (val: number) => Math.round(val * 1000 * 100) / 100;

  return {
    rps: rpsMatch ? parseFloat(rpsMatch[1]) : 0,
    latency: {
      avg: avgMatch ? toMs(parseFloat(avgMatch[1])) : 0,
      p50: p50Match ? toMs(parseFloat(p50Match[1])) : undefined,
      p95: p95Match ? toMs(parseFloat(p95Match[1])) : undefined,
      p99: p99Match ? toMs(parseFloat(p99Match[1])) : undefined,
    },
    totalRequests,
    successCount: totalRequests,
    failCount: 0,
    errorRate: 0,
  };
};
