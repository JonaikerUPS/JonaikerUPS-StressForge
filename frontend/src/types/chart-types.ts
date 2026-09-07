export interface TimeSeriesPoint {
  time: string | number;
  value: number;
}

export interface PercentilePoint {
  time: string;
  p50: number;
  p90: number;
  p99: number;
}

export interface DistributionPoint {
  label: string;
  count: number;
}

export interface UnifiedChartData {
  timeSeries: TimeSeriesPoint[];
  percentiles: PercentilePoint[];
  distribution: DistributionPoint[];
}
