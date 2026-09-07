import { ToolMetrics } from './types';

export const parseLocust = (logContent: string): ToolMetrics => {
  const lines = logContent.split('\n');
  const aggLine = lines.findLast(line => line.includes('Aggregated') && line.includes('|'));
  
  if (!aggLine) return { rps: 0, latency: { avg: 0 }, totalRequests: 0, successCount: 0, failCount: 0, errorRate: 0 };

  const parts = aggLine.split('|').map(p => p.trim());
  // Format: "Aggregated  <#reqs> <#fails>(<fail%>)" | "<Avg> <Min> <Max> <Med>" | "<req/s> <failures/s>"
  const col0 = parts[0].split(/\s+/);
  const totalReqs = parseInt(col0[1]) || 0;
  const failsStr = col0[2] || '0';
  const fails = parseInt(failsStr) || 0;

  const col1 = parts[1] ? parts[1].split(/\s+/) : [];
  const avg = parseFloat(col1[0]) || 0;
  const p50 = parseFloat(col1[3]) || undefined;

  const col2 = parts[2] ? parts[2].split(/\s+/) : [];
  const rps = parseFloat(col2[0]) || 0;

  return {
    rps,
    latency: { 
      avg, 
      p50,
      p95: undefined,
      p99: undefined
    },
    totalRequests: totalReqs,
    successCount: totalReqs - fails,
    failCount: fails,
    errorRate: totalReqs > 0 ? (fails / totalReqs) * 100 : 0,
  };
};
