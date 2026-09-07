
import { BaseDashboard } from './BaseDashboard';
import { TimeSeriesChart } from '@/components/ui/charts/TimeSeriesChart';
import { PercentilesChart } from '@/components/ui/charts/PercentilesChart';
import { DistributionHistogram } from '@/components/ui/charts/DistributionHistogram';
import { transformAutocannonData } from '@/lib/chart-transformers';

export const AutocannonDashboard = ({ rawData }: { rawData: any }) => {
  const data = transformAutocannonData(rawData);

  return (
    <BaseDashboard title="Autocannon Extreme Load">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="bg-white/80 border border-slate-200 shadow-sm backdrop-blur-xl p-6 rounded-2xl dark:bg-slate-900/50 dark:border-white/10">
          <h4 className="text-slate-800 dark:text-slate-200 mb-4 font-semibold">RPS over Time</h4>
          <TimeSeriesChart data={data.timeSeries} />
        </div>
        <div className="bg-white/80 border border-slate-200 shadow-sm backdrop-blur-xl p-6 rounded-2xl dark:bg-slate-900/50 dark:border-white/10">
          <h4 className="text-slate-800 dark:text-slate-200 mb-4 font-semibold">Latency Percentiles</h4>
          <PercentilesChart data={data.percentiles} />
        </div>
        <div className="bg-white/80 border border-slate-200 shadow-sm backdrop-blur-xl p-6 rounded-2xl dark:bg-slate-900/50 dark:border-white/10 col-span-1 lg:col-span-2">
          <h4 className="text-slate-800 dark:text-slate-200 mb-4 font-semibold">Throughput (Bytes/s)</h4>
          <DistributionHistogram data={data.distribution} />
        </div>
      </div>
    </BaseDashboard>
  );
};
