import { ToolMetrics } from './types';

export const parseArtillery = (logContent: string): ToolMetrics => {
  console.log("[DEBUG] Parsing Artillery log, content length:", logContent.length);
  
  const medianMatch = logContent.match(/(?:median|mean)[\s\.]+(?:latency)?[\s\.]+([\d.]+)/i);
  const p95Match = logContent.match(/p95[\s\.]+(?:latency)?[\s\.]+([\d.]+)/i);
  const p99Match = logContent.match(/p99[\s\.]+(?:latency)?[\s\.]+([\d.]+)/i);
  
  const totalReqMatch = logContent.match(/(?:http\.requests|Requests completed)[\.\s]+(\d+)/i);
  const code200Match = logContent.match(/(?:http\.codes\.200|2xx)[\.\s]+(\d+)/i);
  const rpsMatch = logContent.match(/(?:http\.request_rate|RPS)[\.\s]+([\d.]+)/i);

  console.log("[DEBUG] Matches:", { medianMatch: medianMatch ? medianMatch[1] : 'null', rpsMatch: rpsMatch ? rpsMatch[1] : 'null', totalReqMatch: totalReqMatch ? totalReqMatch[1] : 'null' });
  
  const totalRequests = totalReqMatch ? parseInt(totalReqMatch[1]) : 0;
  const successCount = code200Match ? parseInt(code200Match[1]) : 0;
  const failCount = totalRequests - successCount;

  return {
    rps: rpsMatch ? parseFloat(rpsMatch[1]) : 0,
    latency: {
      avg: medianMatch ? parseFloat(medianMatch[1]) : 0, // Usando mediana como proxy de avg
      p50: medianMatch ? parseFloat(medianMatch[1]) : undefined,
      p95: p95Match ? parseFloat(p95Match[1]) : undefined,
      p99: p99Match ? parseFloat(p99Match[1]) : undefined,
    },
    totalRequests,
    successCount,
    failCount,
    errorRate: totalRequests > 0 ? (failCount / totalRequests) * 100 : 0,
  };
};
