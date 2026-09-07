import { TestRun } from '../models/TestRun';
import { TestResult } from '../models/TestResult';
import { runParallelTools, TestConfig, TestTool } from './tool-runner';
import { startMonitoring, stopMonitoring, getLatestSample } from './monitor';
import { testEmitter } from './emitter';

async function safeFindTest(testId: string) {
  try { return await TestRun.findById(testId); } catch { return null; }
}
async function safeSave(doc: any) {
  try { await doc.save(); } catch { /* noop */ }
}

export const runStressTest = async (
  testId: string,
  toolsToRun: TestTool[],
  targetUrl: string,
  concurrency: number,
  durationMs: number,
  endpoints?: { endpoint: string; method: string; requestBody?: string }[],
  requests?: number,
  category: string = 'stress'
) => {
  testEmitter.emit('test-started', { message: `Ejecutando ${toolsToRun.join(', ')} contra ${targetUrl}`, type: category });

  let test = await safeFindTest(testId);
  if (test) {
    test.status = 'running';
    await safeSave(test);
  }

  console.log(`Ejecutando pruebas paralelas ${toolsToRun.join(', ')} contra ${targetUrl} (ID: ${testId})`);

  startMonitoring();

  const configs: TestConfig[] = [];
  
  for (const tool of toolsToRun) {
      if (endpoints && endpoints.length > 0) {
          for (const ep of endpoints) {
              const epConfig = ep as any;
              configs.push({
                  testId,
                  tool,
                  targetUrl: (typeof ep.endpoint === 'string' && ep.endpoint.startsWith('http')) ? ep.endpoint : `http://${ep.endpoint || ''}`,
                  concurrency: epConfig.concurrency > 0 ? epConfig.concurrency : concurrency,
                  durationMs: epConfig.durationMs > 0 ? epConfig.durationMs : (epConfig.duration ? epConfig.duration * 1000 : durationMs),
                  type: category,
                  requests: epConfig.requests > 0 ? epConfig.requests : requests,
                  rampUp: epConfig.rampUp || 0,
                  endpoints: [ep]
              });
          }
      } else {
          configs.push({
              testId,
              tool,
              targetUrl: (typeof targetUrl === 'string' && targetUrl.startsWith('http')) ? targetUrl : `http://${targetUrl || ''}`,
              concurrency: concurrency > 0 ? concurrency : 1,
              durationMs: durationMs > 0 ? durationMs : 10000,
              type: category,
              requests: requests > 0 ? requests : 1,
              endpoints: [{ endpoint: '/', method: 'GET' }]
          });
      }
  }

  let allLogs = '';
  const finalMetricsMap: Record<string, any> = {};
  let perEndpointResults: any[] = [];

  try {
    perEndpointResults = await runParallelTools(
        configs,
        (metrics) => {
            testEmitter.emit('test-update', { type: 'metrics', data: metrics, testType: category });
        },
        (tool, log) => {
            allLogs += `[${tool}] ${log}\n`;
            console.log(`[BACKEND DEBUG] Emitiendo test-update (log) para ${tool}: ${log}`);
            testEmitter.emit('test-update', { type: 'log', tool, log, testType: category });
        },
        (tool, finalMetrics) => {
            if (finalMetrics) {
                finalMetricsMap[tool] = finalMetrics;
            }
            testEmitter.emit('test-update', { type: 'complete', tool, metrics: finalMetrics, testType: category });
        }
    );
  } catch (err: any) {
    console.error(`Error en runParallelTools:`, err);
  }

  const monitorSample = getLatestSample();

  const summary = {
      totalRequests: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.totalRequests || 0), 0),
      successful: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.successCount || 0), 0),
      failed: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.failCount || 0), 0),
      avgLatency: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.latency?.avg || 0), 0) / Math.max(1, Object.keys(finalMetricsMap).length),
      minLatency: Math.min(...Object.values(finalMetricsMap).map((m: any) => m.latency?.avg || Infinity)),
      maxLatency: Math.max(...Object.values(finalMetricsMap).map((m: any) => m.latency?.avg || 0)),
      p95: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.latency?.p95 || 0), 0) / Math.max(1, Object.keys(finalMetricsMap).length),
      p99: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.latency?.p99 || 0), 0) / Math.max(1, Object.keys(finalMetricsMap).length),
      throughput: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.throughput || 0), 0),
      durationMs,
      cpuUsage: monitorSample?.cpuUsage || 0,
      ramUsage: monitorSample?.usedRamGB || 0,
      concurrency: concurrency || 10,
      percentiles: {
          p50: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.latency?.p50 || 0), 0) / Math.max(1, Object.keys(finalMetricsMap).length),
          p95: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.latency?.p95 || 0), 0) / Math.max(1, Object.keys(finalMetricsMap).length),
          p99: Object.values(finalMetricsMap).reduce((sum: number, m: any) => sum + (m.latency?.p99 || 0), 0) / Math.max(1, Object.keys(finalMetricsMap).length),
      }
  };

  if (test) {
    test.status = 'completed';
    test.summary = summary;
    test.rawOutput = allLogs;
    await safeSave(test);
  }

  const resolvedCategory = (category === 'security' ? 'SECURITY' : category === 'database' ? 'DATABASE' : category.toUpperCase() || 'API');

  // Si hay resultados específicos por endpoint, guardamos cada uno
  if (perEndpointResults && perEndpointResults.length > 0) {
    for (const ep of perEndpointResults) {
      try {
        await TestResult.create({
            toolName: toolsToRun[0] || 'api',
            category: resolvedCategory,
            endpoint: ep.url,
            method: ep.method || 'GET',
            logContent: allLogs,
            metrics: {
                rps: ep.totalRequests > 0 ? ep.totalRequests / Math.max(1, durationMs / 1000) : 0,
                latency: {
                    avg: ep.avgLatency || 0,
                    p50: ep.avgLatency * 0.8 || 0,
                    p95: ep.p95 || 0,
                    p99: ep.p99 || 0,
                },
                totalRequests: ep.totalRequests || 0,
                successCount: ep.successCount || 0,
                failCount: ep.failCount || 0,
                errorRate: ep.totalRequests > 0 ? (ep.failCount / ep.totalRequests) * 100 : 0,
            },
            userId: test?.userId || null,
            createdAt: new Date(),
        });
      } catch { /* noop */ }
    }
  }

  // Guardar también registro consolidado por herramienta si no hay endpoints o para métricas globales
  if (Object.keys(finalMetricsMap).length > 0) {
    for (const [tool, metrics] of Object.entries(finalMetricsMap)) {
      try {
        await TestResult.create({
            toolName: tool,
            category: resolvedCategory,
            endpoint: targetUrl,
            method: 'GET',
            logContent: allLogs,
            metrics: {
                rps: metrics.throughput || 0,
                latency: {
                    avg: metrics.latency?.avg || 0,
                    p50: metrics.latency?.p50 || metrics.latency?.avg || 0,
                    p95: metrics.latency?.p95 || 0,
                    p99: metrics.latency?.p99 || 0,
                },
                totalRequests: metrics.totalRequests || 0,
                successCount: metrics.successCount || 0,
                failCount: metrics.failCount || 0,
                errorRate: metrics.errorRate || 0,
            },
            userId: test?.userId || null,
            createdAt: new Date(),
        });
      } catch { /* noop */ }
    }
  } else if (!perEndpointResults || perEndpointResults.length === 0) {
    // Fallback con el summary global
    try {
      await TestResult.create({
          toolName: toolsToRun[0] || 'simulacion',
          category: resolvedCategory,
          endpoint: targetUrl,
          method: 'GET',
          logContent: allLogs,
          metrics: {
              rps: summary.throughput || 0,
              latency: {
                  avg: summary.avgLatency || 0,
                  p50: summary.percentiles?.p50 || 0,
                  p95: summary.p95 || 0,
                  p99: summary.p99 || 0,
              },
              totalRequests: summary.totalRequests || 0,
              successCount: summary.successful || 0,
              failCount: summary.failed || 0,
              errorRate: summary.totalRequests > 0 ? (summary.failed / summary.totalRequests) * 100 : 0,
          },
          userId: test?.userId || null,
          createdAt: new Date(),
      });
    } catch { /* noop */ }
  }

  testEmitter.emit('test-suite-complete', {
      testId,
      summary,
      finalMetrics: finalMetricsMap,
      rawOutput: allLogs,
      testType: category
  });

  // ... (antes de emitir test-data)
  console.log(`[DEBUG_EMIT] Emitiendo test-data con ${perEndpointResults.length} resultados encontrados para ${endpoints?.length} endpoints configurados`);
  
  testEmitter.emit('test-data', {
      type: 'complete',
      summary,
      metrics: finalMetricsMap,
      testType: category,
      endpoints: (endpoints || []).map((ep) => {
          const match = perEndpointResults.find(r => r.url === ep.endpoint && r.method === (ep.method || 'GET'));
          
          if (match) {
            console.log(`[DEBUG_MATCH] Match encontrado para ${ep.endpoint}:`, match);
            return {
              url: ep.endpoint,
              method: ep.method || 'GET',
              latency: match.avgLatency || 0,
              status: (match.status === 'error' ? 'error' : 'success') as 'success' | 'error',
              avgLatency: match.avgLatency || 0,
              successRate: match.totalRequests > 0 ? Math.round((match.successCount / match.totalRequests) * 100) : 100,
              totalRequests: match.totalRequests,
              successful: match.successCount,
              failed: match.failCount,
              p50: match.avgLatency * 0.8 || 0,
              p95: match.p95 || 0,
              p99: match.p99 || 0,
              throughput: summary.throughput / Math.max(1, endpoints?.length || 1),
              rawOutput: allLogs,
              percentiles: { p50: match.avgLatency * 0.8 || 0, p95: match.p95 || 0, p99: match.p99 || 0 },
            };
          }
          console.log(`[DEBUG_MATCH] NO Match para ${ep.endpoint}, usando valores por defecto`);
          return {
            url: ep.endpoint,
            method: ep.method || 'GET',
            latency: 0,
            status: 'error' as 'error',
            avgLatency: 0,
            successRate: 0,
            totalRequests: 0,
            successful: 0,
            failed: 0,
            p50: 0,
            p95: 0,
            p99: 0,
            throughput: 0,
            rawOutput: allLogs,
            percentiles: { p50: 0, p95: 0, p99: 0 },
          };
      }),
  });

  console.log(`Pruebas completadas para ${testId}`);
};