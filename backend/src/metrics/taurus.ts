import { ToolMetrics } from './types';

export const parseTaurus = (logContent: string): ToolMetrics => {
  const lines = logContent.split('\n');
  let currentVu = 0;
  let currentRps = 0;
  let currentLatencyMs = 0;
  let totalSucc = 0;
  let totalFail = 0;

  for (const line of lines) {
    if (!line.includes('Current:')) continue;

    const vuMatch = line.match(/Current:\s*([\d,]+)\s*vu/i);
    const succMatch = line.match(/([\d,]+)\s*succ/i);
    const failMatch = line.match(/([\d,]+)\s*fail/i);
    const latMatch = line.match(/([\d.]+)\s*avg\s*rt/i);

    if (vuMatch) currentVu = parseInt(vuMatch[1].replace(/,/g, '')) || currentVu;
    const succ = succMatch ? parseInt(succMatch[1].replace(/,/g, '')) || 0 : 0;
    const fail = failMatch ? parseInt(failMatch[1].replace(/,/g, '')) || 0 : 0;

    if (latMatch) {
      const latVal = parseFloat(latMatch[1]);
      currentLatencyMs = latVal < 10 ? Math.round(latVal * 1000 * 100) / 100 : Math.round(latVal * 100) / 100;
    }

    currentRps = succ + fail;
    totalSucc += succ;
    totalFail += fail;
  }

  const samplesMatch = logContent.match(/Samples count:\s+(\d+),\s+([\d.]+)%\s+failures/);
  const totalRequests = samplesMatch ? parseInt(samplesMatch[1]) : (totalSucc + totalFail);
  
  // Extraer percentiles
  const percentiles: Record<string, number> = {};
  const percentileMatches = logContent.matchAll(/^\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|/gm);
  for (const match of percentileMatches) {
    percentiles[match[1]] = Math.round(parseFloat(match[2]) * 1000 * 100) / 100;
  }

  // Extraer Label Stats para detectar fallos específicos
  let failCount = samplesMatch ? Math.round(totalRequests * (parseFloat(samplesMatch[2]) / 100)) : totalFail;
  let errorDetails: string | undefined;

  const labelStatsMatch = logContent.matchAll(/^\|\s+([^|]+)\s+\|\s+([^|]+)\s+\|\s+([^|]+)\s+\|\s+([^|]+)\s+\|\s+([^|]+)\s+\|/gm);
  for (const match of labelStatsMatch) {
    const status = match[2].trim();
    const errorMsg = match[5].trim();
    if (status === 'FAIL') {
      failCount = Math.max(failCount, 1);
      if (errorMsg) {
        errorDetails = (errorDetails || '') + ` - [${match[1].trim()}] ${errorMsg}`;
      }
    }
  }

  if (failCount > 0 && !errorDetails) {
      errorDetails = `La prueba falló con ${failCount} errores.`;
  }
  
  if (logContent.includes('502 Bad Gateway')) {
      errorDetails = (errorDetails || '') + ' - Se detectó Bad Gateway (502).';
  }

  const avgLat = percentiles['50.0'] || currentLatencyMs || 0;

  return {
    rps: currentRps,
    latency: {
      avg: avgLat,
      p50: percentiles['50.0'] || (avgLat * 0.8),
      p95: percentiles['95.0'] || (avgLat * 1.5),
      p99: percentiles['99.0'] || (avgLat * 2),
    },
    totalRequests,
    successCount: samplesMatch ? (totalRequests - failCount) : totalSucc,
    failCount,
    errorRate: totalRequests > 0 ? (failCount / totalRequests) * 100 : 0,
    concurrency: currentVu,
    errorDetails,
    percentiles,
  };
};
