"use client";

import React from "react";
import { UnifiedMetrics } from "@/types/metrics";
import { Activity, AlertTriangle, Cpu, Zap, Download } from "lucide-react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { generateReportPdf } from "../lib/pdf-generator";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false }) as any;

export interface ToolViewProps {
  metrics: UnifiedMetrics | null;
  toolName: string;
  isUp: boolean;
  endpoints: any[];
  onStartTest: (config: any) => void;
  running: boolean;
}

// Chart options
const getChartOptions = (color: string, type: "area" | "bar" | "line"): ApexOptions => ({
  chart: {
    toolbar: { show: false },
    type,
    background: "transparent",
    animations: { enabled: true, speed: 600, animateGradually: { enabled: true, delay: 80 } },
  },
  colors: [color],
  stroke: { curve: "smooth", width: 2 },
  fill: {
    type: "gradient",
    gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 },
  },
  grid: {
    borderColor: "rgba(148,163,184,0.08)",
    strokeDashArray: 3,
  },
  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { style: { colors: "#94a3b8", fontSize: "11px" } } },
  tooltip: { theme: "dark", style: { fontSize: "12px" } },
  dataLabels: { enabled: false },
});

// ── MetricChart ─────────────────────────────────────────────────────
const MetricChart = ({
  title, color, seriesName, data, type = "area", metrics, unit = "",
}: {
  title: string; color: string; seriesName: string; data: number[];
  type?: "area" | "bar" | "line"; metrics: UnifiedMetrics | null; unit?: string;
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!mounted || !metrics) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 dark:border-white/5 dark:bg-white/[0.02] p-4 h-[160px]">
        <div className="absolute inset-x-0 top-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
        <div className="flex flex-col items-center justify-center h-[100px] gap-2">
          <div className="relative">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
              <Activity className="h-4 w-4" style={{ color }} />
            </div>
            <div className="absolute inset-0 rounded-xl animate-ping opacity-20" style={{ backgroundColor: color }} />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-600">Esperando datos…</p>
        </div>
      </div>
    );
  }

  const lastValue = data.length > 0 ? data[data.length - 1] : 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md dark:border-white/8 dark:bg-slate-900/50 dark:hover:border-white/15">
      <div
        className="absolute inset-x-0 top-0 h-[2px] transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div className="flex items-start justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</p>
        <div className="flex h-6 w-6 items-center justify-center rounded-lg transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}18`, color }}>
          <Activity className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {lastValue}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </p>
      <Chart
        key={title + data.length}
        options={getChartOptions(color, type)}
        series={[{ name: seriesName, data }]}
        type={type}
        height={90}
      />
    </div>
  );
};

// ── Tool color map ─────────────────────────────────────────────────
const toolColors: Record<string, { accent: string; from: string; to: string }> = {
  purple: { accent: "#8b5cf6", from: "from-purple-500/10", to: "to-violet-600/5" },
  red:    { accent: "#ef4444", from: "from-red-500/10",    to: "to-rose-600/5"   },
  cyan:   { accent: "#06b6d4", from: "from-cyan-500/10",   to: "to-sky-600/5"    },
  green:  { accent: "#10b981", from: "from-emerald-500/10",to: "to-teal-600/5"   },
  amber:  { accent: "#f59e0b", from: "from-amber-500/10",  to: "to-orange-600/5" },
  orange: { accent: "#f97316", from: "from-orange-500/10", to: "to-red-600/5"    },
  teal:   { accent: "#14b8a6", from: "from-teal-500/10",   to: "to-cyan-600/5"   },
  slate:  { accent: "#64748b", from: "from-slate-500/10",  to: "to-slate-600/5"  },
  sky:    { accent: "#0ea5e9", from: "from-sky-500/10",    to: "to-blue-600/5"   },
};

// ── BaseView ──────────────────────────────────────────────────────
const BaseView = ({ title, description, colorClass, isUp, running, metrics, endpoints, children }: any) => {
  const c = toolColors[colorClass] ?? toolColors["sky"];
  
  // Preparamos los datos para el PDF
  const pdfData = metrics ? [{ time: "Final", vus: metrics.totalRequests, rps: metrics.throughput, latency: metrics.latency }] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br ${c.from} ${c.to} bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/8 dark:bg-slate-900/50`}>
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${c.accent}80, transparent)` }}
        />
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: c.accent }} />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm" style={{ backgroundColor: `${c.accent}18` }}>
              <Zap className="h-5 w-5" style={{ color: c.accent }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => generateReportPdf(title, pdfData, endpoints, metrics?.errorDetails, metrics?.percentiles, metrics?.rawOutput)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download size={14} />
              PDF
            </button>
            {metrics && (
              <div className="flex gap-2">
                <span className="rounded-full px-3 py-1 text-xs font-semibold border" style={{ backgroundColor: `${c.accent}12`, borderColor: `${c.accent}25`, color: c.accent }}>
                  {metrics.totalRequests ?? 0} reqs
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                  (metrics.errorRate ?? 0) < 1
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}>
                  {(metrics.errorRate ?? 0) < 1 ? "✓" : "⚠"} {metrics.errorRate?.toFixed(1)}% err
                </span>
              </div>
            )}

            {!isUp && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Herramienta no disponible
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
};

// ── Tool Views ─────────────────────────────────────────────────────
export const K6View = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="k6" description="Performance Focus — JavaScript native" colorClass="purple" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Latencia Avg" unit="ms" color="#8b5cf6" seriesName="ms" data={metrics ? [metrics.latency.avg] : []} metrics={metrics} />
    <MetricChart title="Throughput"   unit="req/s" color="#a78bfa" seriesName="rps" data={metrics ? [metrics.throughput] : []} metrics={metrics} />
    <MetricChart title="Latencia p95" unit="ms" color="#c4b5fd" seriesName="p95" data={metrics ? [metrics.latency.p95] : []} metrics={metrics} />
    <MetricChart title="Error Rate"   unit="%" color="#ddd6fe" seriesName="%" data={metrics ? [metrics.errorRate] : []} type="bar" metrics={metrics} />
  </BaseView>
);

export const VegetaView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="Vegeta" description="HTTP Load Testing — Go native" colorClass="sky" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Latencia Avg" unit="ms"    color="#0ea5e9" seriesName="ms"  data={metrics ? [metrics.latency.avg] : []} metrics={metrics} />
    <MetricChart title="Throughput"   unit="req/s" color="#38bdf8" seriesName="rps" data={metrics ? [metrics.throughput]  : []} metrics={metrics} />
    <MetricChart title="Error Rate"   unit="%"     color="#7dd3fc" seriesName="%"   data={metrics ? [metrics.errorRate]   : []} type="bar" metrics={metrics} />
  </BaseView>
);

export const ArtilleryView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="Artillery" description="High Load — YAML scenarios" colorClass="red" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Throughput" unit="req/s" color="#ef4444" seriesName="rps" data={metrics ? [metrics.throughput] : []} metrics={metrics} />
    <MetricChart title="Error Rate" unit="%"     color="#f87171" seriesName="%"   data={metrics ? [metrics.errorRate]  : []} type="bar" metrics={metrics} />
  </BaseView>
);

export const TaurusView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="Taurus" description="Unified YAML — multi-backend" colorClass="cyan" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Throughput" unit="req/s" color="#06b6d4" seriesName="rps" data={metrics ? [metrics.throughput] : []} metrics={metrics} />
    <MetricChart title="CPU Usage"  unit="%"     color="#22d3ee" seriesName="%"   data={metrics ? [metrics.cpuUsage]   : []} metrics={metrics} />
  </BaseView>
);

export const LocustView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="Locust" description="Python Simulation — swarm testing" colorClass="green" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Latencia" unit="ms" color="#10b981" seriesName="ms" data={metrics ? [metrics.latency.avg] : []} metrics={metrics} />
    <MetricChart title="Error Rate" unit="%" color="#34d399" seriesName="%" data={metrics ? [metrics.errorRate]   : []} type="bar" metrics={metrics} />
  </BaseView>
);

export const JMeterView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="JMeter" description="Thread Plans — enterprise grade" colorClass="amber" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Throughput" unit="req/s" color="#f59e0b" seriesName="rps" data={metrics ? [metrics.throughput] : []} metrics={metrics} />
    <MetricChart title="Error Rate" unit="%"     color="#fbbf24" seriesName="%"   data={metrics ? [metrics.errorRate]  : []} type="bar" metrics={metrics} />
  </BaseView>
);

export const AutocannonView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="Autocannon" description="Extreme Load — Node.js powered" colorClass="orange" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Throughput" unit="req/s" color="#f97316" seriesName="rps" data={metrics ? [metrics.throughput]  : []} metrics={metrics} />
    <MetricChart title="Latencia"   unit="ms"    color="#fb923c" seriesName="ms"  data={metrics ? [metrics.latency.avg] : []} metrics={metrics} />
  </BaseView>
);

export const HeyView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="Hey" description="CLI Benchmark — Go lightweight" colorClass="teal" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Latencia"   unit="ms"    color="#14b8a6" seriesName="ms"  data={metrics ? [metrics.latency.avg] : []} metrics={metrics} />
    <MetricChart title="Throughput" unit="req/s" color="#2dd4bf" seriesName="rps" data={metrics ? [metrics.throughput]  : []} metrics={metrics} />
  </BaseView>
);

export const SimulacionView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="Simulación Total" description="Consolidado — todas las métricas" colorClass="slate" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Latencia"   unit="ms"    color="#64748b" seriesName="ms"  data={metrics ? [metrics.latency.avg] : []} metrics={metrics} />
    <MetricChart title="Throughput" unit="req/s" color="#94a3b8" seriesName="rps" data={metrics ? [metrics.throughput]  : []} metrics={metrics} />
    <MetricChart title="Error Rate" unit="%"     color="#475569" seriesName="%"   data={metrics ? [metrics.errorRate]   : []} type="bar" metrics={metrics} />
    <MetricChart title="CPU Load"   unit="%"     color="#334155" seriesName="%"   data={metrics ? [metrics.cpuUsage]    : []} metrics={metrics} />
  </BaseView>
);

export const AggregatedView = ({ metrics, ...props }: ToolViewProps) => (
  <BaseView title="Consolidado" description="Comparativa general entre herramientas" colorClass="sky" metrics={metrics} {...props} onStart={() => props.onStartTest({})}>
    <MetricChart title="Latencia Avg" unit="ms"    color="#0ea5e9" seriesName="ms"  data={metrics ? [metrics.latency.avg] : []} metrics={metrics} />
    <MetricChart title="Throughput"   unit="req/s" color="#38bdf8" seriesName="rps" data={metrics ? [metrics.throughput]  : []} metrics={metrics} />
  </BaseView>
);
