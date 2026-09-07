export interface StandardMetrics {
  latency: { avg: number; p95: number; p99: number };
  errorRate: number;
  throughput: number;
  concurrency: number;
  successful: number;
  failed: number;
}

export function parseTaurusLog(log: string): StandardMetrics | null {
  // Taurus format example: INFO: Current: 10 vu61 succ0 fail0.145 avg rt
  // Make regex more flexible for spaces and prefixes
  const match = log.match(/Current:\s*(\d+)\s*vu(\d+)\s*succ(\d+)\s*fail([\d\.]+)\s*avg\s*rt/i);
  
  if (!match) {
    // Only log if it's actually a 'Current' log line, otherwise ignore quietly
    return null;
  }

  return {
    latency: { 
      avg: 0, 
      p95: 0,
      p99: 0
    },
    errorRate: parseFloat(match[4]) || 0,
    throughput: 0,
    concurrency: parseInt(match[2]) || 0, // Match 2 is vu
    successful: parseInt(match[3]) || 0,
    failed: Math.round(parseFloat(match[4])) || 0,
  };
}

export function parseK6Log(log: string): StandardMetrics | null {
  // Assuming k6 outputs JSON-like logs
  try {
    const data = JSON.parse(log);
    if (data.metric === 'http_req_duration') {
       return {
         latency: { avg: data.value, p95: 0, p99: 0 },
         errorRate: 0,
         throughput: 0,
         concurrency: 0,
         successful: 0,
         failed: 0
       };
    }
  } catch (e) {
    return null;
  }
  return null;
}

export function parseLog(log: string, toolType: string): StandardMetrics | null {
  // Parsers genéricos para herramientas de estrés
  switch (toolType) {
    case 'taurus':
      return parseTaurusLog(log);
    case 'websocket':
      // El dashboard de websocket ya gestiona sus métricas internamente
      return null;
    default:
      return null;
  }
}

