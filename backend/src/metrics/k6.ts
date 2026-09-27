import { ToolMetrics } from './types';

export const parseK6 = (logContent: string): ToolMetrics => {
  // Tomar solo las últimas 50 líneas para asegurar que leemos el resumen
  const lines = logContent.split('\n');
  const summary = lines.slice(-50).join('\n');

  // Regex más flexibles, ignorando múltiples espacios y puntos
  const rpsMatch = summary.match(/http_reqs[.\s]+:\s*([\d.]+)\s+([\d.]+)\/s/i);
  const avgLatencyMatch = summary.match(/http_req_duration[.\s]+:\s+avg=([\d.]+)(ms|s|µs)?/i);
  const p50Match = summary.match(/med=([\d\.]+)/);
  const p95Match = summary.match(/p\(95\)=([\d\.]+)/);
  const p99Match = summary.match(/p\(99\)=([\d\.]+)/);
  
  const totalReqMatch = summary.match(/http_reqs[.\s]+:\s*([\d.]+)/i)
    || summary.match(/iterations[.\s]+:\s*([\d.]+)/i);
  const failedReqMatch = summary.match(/http_req_failed[.\s]+:\s+([\d.]+)%\s+(\d+)\s+out of/i);

  const totalRequests = totalReqMatch ? Math.round(parseFloat(totalReqMatch[1])) : 0;
  const errors = failedReqMatch ? parseInt(failedReqMatch[2]) : 0;
  const latencyValue = avgLatencyMatch ? parseFloat(avgLatencyMatch[1]) : 0;
  const latencyUnit = avgLatencyMatch?.[2]?.toLowerCase();
  const avgLatency = latencyUnit === 's'
    ? latencyValue * 1000
    : latencyUnit === 'µs'
      ? latencyValue / 1000
      : latencyValue;

  return {
    rps: rpsMatch ? parseFloat(rpsMatch[2]) : 0,
    latency: {
      avg: avgLatency,
      p50: p50Match ? parseFloat(p50Match[1]) : undefined,
      p95: p95Match ? parseFloat(p95Match[1]) : undefined,
      p99: p99Match ? parseFloat(p99Match[1]) : undefined,
    },
    totalRequests,
    successCount: totalRequests - errors,
    failCount: errors,
    errorRate: failedReqMatch ? parseFloat(failedReqMatch[1]) : 0,
    concurrency: 0,
    cpu: 0,
    ram: 0,
    dbLatency: 0
  };
};
