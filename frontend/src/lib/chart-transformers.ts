
import { UnifiedChartData } from '@/types/chart-types';

// Transformer para Autocannon
export const transformAutocannonData = (rawData: any): UnifiedChartData => ({
  timeSeries: rawData.requests?.map((r: any) => ({ time: r.timestamp, value: r.rps })) || [],
  percentiles: [{ time: 'now', p50: rawData.latency?.p50 || 0, p90: rawData.latency?.p95 || 0, p99: rawData.latency?.p99 || 0 }],
  distribution: [{ label: 'Bytes/s', count: rawData.throughput?.bytesPerSecond || 0 }]
});

// Transformer para JMeter (asumiendo parseo de CSV .jtl a JSON)
export const transformJMeterData = (rawData: any): UnifiedChartData => ({
    timeSeries: rawData.map((row: any) => ({ time: row.timeStamp, value: row.Latency })) || [],
    percentiles: [{ time: 'final', p50: rawData[0]?.median || 0, p90: rawData[0]?.p90 || 0, p99: rawData[0]?.p99 || 0 }],
    distribution: [{ label: 'Hits', count: rawData.length || 0 }]
});

// Transformer para Taurus
export const transformTaurusData = (rawData: any): UnifiedChartData => ({
    timeSeries: rawData.map((row: any) => ({ time: row.ts, value: row.rps })) || [],
    percentiles: [{ time: 'final', p50: rawData.p50 || 0, p90: rawData.p90 || 0, p99: rawData.p99 || 0 }],
    distribution: [{ label: 'Pass', count: rawData.pass || 0 }, { label: 'Fail', count: rawData.fail || 0 }]
});

// Transformer para Hey
export const transformHeyData = (rawData: any): UnifiedChartData => ({
    timeSeries: [], // Hey es snapshot, no time series
    percentiles: [{ time: 'final', p50: rawData.latency.p50, p90: rawData.latency.p90, p99: rawData.latency.p99 }],
    distribution: rawData.histogram.map((h: any) => ({ label: h.range, count: h.count }))
});

// Transformer para Artillery
export const transformArtilleryData = (rawData: any): UnifiedChartData => ({
  timeSeries: rawData.scenarios?.map((s: any) => ({ time: s.timestamp, value: s.rps })) || [],
  percentiles: [{ time: 'final', p50: rawData.latency?.p50 || 0, p90: rawData.latency?.p95 || 0, p99: rawData.latency?.p99 || 0 }],
  distribution: [{ label: 'Errors', count: rawData.errors?.total || 0 }]
});

// Transformer para Locust
export const transformLocustData = (rawData: any): UnifiedChartData => ({
    timeSeries: rawData.stats?.map((s: any) => ({ time: s.name, value: s.current_rps })) || [],
    percentiles: [{ time: 'final', p50: rawData.total.latency_p50 || 0, p90: rawData.total.latency_p90 || 0, p99: rawData.total.latency_p99 || 0 }],
    distribution: [{ label: 'Failures', count: rawData.total.failures || 0 }]
});

