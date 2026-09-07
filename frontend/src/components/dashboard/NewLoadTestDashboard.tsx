"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════
   COLOR PALETTE (matches the reference screenshot)
   ═══════════════════════════════════════════════════════════════════════ */
const C = {
  cyan: "#06b6d4",
  blue: "#3b82f6",
  red: "#ef4444",
  orange: "#f97316",
  gold: "#eab308",
  green: "#10b981",
  purple: "#8b5cf6",
  pink: "#ec4899",
  cardBg: "#131c2e",
  panelBg: "#0f172a",
  border: "#1e293b",
};

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA — HTTP Status Distribution (4 slices as in image)
   ═══════════════════════════════════════════════════════════════════════ */
const HTTP_STATUSES = [
  { name: "HTTP 200", code: "200", value: 125450, percentage: 95, color: C.green },
  { name: "HTTP 404", code: "404", value: 2640, percentage: 2, color: C.gold },
  { name: "HTTP 504", code: "504", value: 2640, percentage: 2, color: C.orange },
  { name: "HTTP 500", code: "500", value: 2642, percentage: 1, color: C.red },
];

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA — TTFB Regional (for the US map + legend)
   ═══════════════════════════════════════════════════════════════════════ */
const TTFB_LEGEND = [
  { label: "620 ms", color: "#065f46" },
  { label: "585 ms", color: "#047857" },
  { label: "423 ms", color: "#059669" },
  { label: "223 ms", color: "#10b981" },
  { label: "125 ms", color: "#34d399" },
  { label: "65 ms", color: "#6ee7b7" },
];

/* ═══════════════════════════════════════════════════════════════════════
   SPARKLINE SHAPE GENERATORS (varied like the screenshot)
   ═══════════════════════════════════════════════════════════════════════ */
function generateSparkline(shape: "wave" | "spike" | "ramp" | "plateau" | "sawtooth" | "dip", length = 20) {
  return Array.from({ length }, (_, i) => {
    const t = i / (length - 1);
    let v = 0;
    switch (shape) {
      case "wave":
        v = 50 + Math.sin(t * Math.PI * 3) * 30 + Math.random() * 10;
        break;
      case "spike":
        v = i === Math.floor(length * 0.3) ? 90 : 15 + Math.random() * 10;
        break;
      case "ramp":
        v = 20 + t * 60 + Math.random() * 8;
        break;
      case "plateau":
        v = t < 0.3 ? 20 + t * 100 : 55 + Math.random() * 8;
        break;
      case "sawtooth":
        v = 30 + ((i % 5) / 4) * 50 + Math.random() * 5;
        break;
      case "dip":
        v = 60 - Math.sin(t * Math.PI) * 35 + Math.random() * 8;
        break;
    }
    return { step: i, v: Number(v.toFixed(1)) };
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   US MAP SVG (simplified path for choropleth)
   ═══════════════════════════════════════════════════════════════════════ */
function USMapSVG() {
  return (
    <svg viewBox="0 0 960 600" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="map-grad-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#065f46" stopOpacity={0.8} />
        </linearGradient>
      </defs>
      {/* West */}
      <path d="M120 100 L280 80 L300 180 L320 280 L280 380 L200 400 L120 350 L80 250 Z"
        fill="#34d399" fillOpacity={0.5} stroke="#10b981" strokeWidth={1.5} />
      {/* Mountain */}
      <path d="M280 80 L400 70 L420 180 L400 300 L320 280 L300 180 Z"
        fill="#10b981" fillOpacity={0.5} stroke="#059669" strokeWidth={1.5} />
      {/* Central */}
      <path d="M400 70 L580 60 L600 160 L620 300 L560 340 L400 300 L420 180 Z"
        fill="#059669" fillOpacity={0.55} stroke="#047857" strokeWidth={1.5} />
      {/* South */}
      <path d="M400 300 L560 340 L620 300 L680 360 L640 440 L520 460 L400 420 L280 380 L320 280 Z"
        fill="#047857" fillOpacity={0.5} stroke="#065f46" strokeWidth={1.5} />
      {/* Northeast */}
      <path d="M580 60 L740 50 L780 120 L760 200 L700 240 L620 200 L600 160 Z"
        fill="#6ee7b7" fillOpacity={0.55} stroke="#34d399" strokeWidth={1.5} />
      {/* Southeast */}
      <path d="M620 200 L700 240 L760 200 L800 280 L780 380 L720 420 L680 360 L620 300 Z"
        fill="#065f46" fillOpacity={0.55} stroke="#047857" strokeWidth={1.5} />
      {/* Florida */}
      <path d="M720 420 L740 460 L760 520 L730 540 L700 480 L680 440 Z"
        fill="#047857" fillOpacity={0.5} stroke="#065f46" strokeWidth={1.5} />
      {/* Alaska (small) */}
      <path d="M100 440 L200 430 L220 480 L180 520 L120 510 L80 480 Z"
        fill="#10b981" fillOpacity={0.4} stroke="#059669" strokeWidth={1} />
      {/* Hawaii (tiny) */}
      <circle cx="300" cy="520" r="12" fill="#34d399" fillOpacity={0.5} stroke="#10b981" strokeWidth={1} />
      <circle cx="330" cy="530" r="8" fill="#34d399" fillOpacity={0.5} stroke="#10b981" strokeWidth={1} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM BAR LABEL (annotation on top of each bar)
   ═══════════════════════════════════════════════════════════════════════ */
function renderBarTopLabel(props: any) {
  const { x, y, width, payload } = props;
  if (!payload) return null;
  
  return (
    <g>
      <text
        x={x + width / 2}
        y={y - 24}
        fill="#94a3b8"
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fontFamily="ui-monospace, monospace"
      >
        {payload.path.split("/").slice(-1)[0]}
      </text>
      <text
        x={x + width / 2}
        y={y - 12}
        fill="#cbd5e1"
        textAnchor="middle"
        fontSize={8}
        fontFamily="ui-monospace, monospace"
      >
        Avg: {Number(payload.avgMs).toFixed(0)}ms
      </text>
      <text
        x={x + width / 2}
        y={y - 2}
        fill={C.orange}
        textAnchor="middle"
        fontSize={8}
        fontFamily="ui-monospace, monospace"
      >
        {payload.rps} RPS
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CUSTOM COMPOSED TOOLTIP
   ═══════════════════════════════════════════════════════════════════════ */
function CustomComposedTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 shadow-2xl text-[11px] space-y-1 min-w-[160px]">
      <div className="font-mono font-bold text-cyan-300 border-b border-slate-800 pb-1 mb-1 truncate">
        /{data.path}
      </div>
      <div className="flex justify-between text-slate-300">
        <span className="text-slate-500">Avg:</span>
        <span className="font-mono font-bold text-white">{data.avgMs} ms</span>
      </div>
      <div className="flex justify-between text-slate-300">
        <span className="text-slate-500">RPS:</span>
        <span className="font-mono font-bold text-orange-400">{data.rps} rps</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
export function NewLoadTestDashboard({
  liveMetrics,
  testEndpoints,
  isRunning,
}: {
  liveMetrics: any;
  testEndpoints: any[];
  isRunning: boolean;
}) {
  // A prueba está corriendo si tenemos métricas activas
  const hasData = liveMetrics && Object.keys(liveMetrics).length > 0;
  const d = useMemo(() => hasData ? liveMetrics : {}, [liveMetrics, hasData]);

  // ── Helper to get historical data for sparklines ────────────────────
  const [history, setHistory] = useState<Record<string, number[]>>({
    latency: Array(20).fill(0),
    error: Array(20).fill(0),
    throughput: Array(20).fill(0),
    vu: Array(20).fill(0),
    success: Array(20).fill(0),
    failed: Array(20).fill(0),
  });

  useEffect(() => {
    if (!hasData) {
      setHistory({
        latency: Array(20).fill(0),
        error: Array(20).fill(0),
        throughput: Array(20).fill(0),
        vu: Array(20).fill(0),
        success: Array(20).fill(0),
        failed: Array(20).fill(0),
      });
      return;
    }
    
    // Only update if the latest value is different to prevent loops
    const newVal = d.latency?.avg ?? 0;
    
    setHistory(prev => {
      if (prev.latency[prev.latency.length - 1] === newVal) return prev;
      return {
        latency: [...prev.latency.slice(1), newVal],
        error: [...prev.error.slice(1), d.errorRate ?? 0],
        throughput: [...prev.throughput.slice(1), d.throughput ?? 0],
        vu: [...prev.vu.slice(1), d.concurrency ?? 0],
        success: [...prev.success.slice(1), d.successful ?? 0],
        failed: [...prev.failed.slice(1), d.failed ?? 0],
      };
    });
  }, [d, hasData]);

  const latencyAvg = d.latency?.avg ?? 0;
  const latencyP95 = d.latency?.p95 ?? 0;
  const errorRate = d.errorRate ?? 0;
  const throughput = d.throughput ?? 0;
  const vu = d.concurrency ?? 0;
  const successCount = d.successful ?? 0;
  const failedCount = d.failed ?? 0;

  // ── Derived data ────────────────────────────────────────────────────
  const endpointChartData = useMemo(() => {
    if (!hasData || !testEndpoints || testEndpoints.length === 0) return [];
    return testEndpoints.slice(0, 5).map((ep: any, idx: number) => ({
      path: ep.endpoint,
      avgMs: typeof ep.latency === "number" ? ep.latency : (ep.latency?.avg ?? 0),
      rps: Math.round((ep.totalReqs || 0) / (ep.configSnapshot?.duration || 10)),
      color: [C.blue, C.purple, C.orange, C.green, C.pink][idx % 5],
    }));
  }, [testEndpoints, hasData]);

  const httpStatuses = useMemo(() => {
    if (!hasData) return HTTP_STATUSES.map(s => ({ ...s, value: 0, percentage: 0 }));
    const total = successCount + failedCount;
    return [
      { name: "HTTP 200", code: "200", value: successCount, percentage: total ? Math.round((successCount/total)*100) : 0, color: C.green },
      { name: "HTTP Errors", code: "5xx", value: failedCount, percentage: total ? Math.round((failedCount/total)*100) : 0, color: C.red },
    ];
  }, [successCount, failedCount, hasData]);


  const [activeSlice, setActiveSlice] = useState<any | null>(null);
  const displaySlice = activeSlice || httpStatuses[0];

  const kpiCards = useMemo(() => [
    { id: "vu", title: "USUARIOS VIRTUALES (VU)", value: d.vu || "0", subtext: "", color: C.gold, sparkData: history.vu },
    { id: "success", title: "SOLICITUDES EXITOSAS", value: d.success || "0", subtext: "", color: C.green, sparkData: history.success },
    { id: "failed", title: "SOLICITUDES FALLIDAS", value: d.fail || "0", subtext: "", color: C.red, sparkData: history.failed },
    { id: "latency", title: "LATENCIA PROM.", value: `${d.avgRt || "0"} ms`, subtext: "", color: C.cyan, sparkData: history.latency },
    { id: "error", title: "TASA DE FALLO (%)", value: `${d.errorRate || "0"}%`, subtext: "", color: C.red, sparkData: history.error },
    { id: "samples", title: "MUESTRAS ACTUALES", value: d.samples || "0", subtext: "", color: C.purple, sparkData: history.tp },
  ], [history, d, hasData]);

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════════════════════════════
         ROW A — TOP 6 KPI SPARKLINE CARDS
         ════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative bg-[#131c2e] border border-slate-800/80 rounded-xl px-5 pt-4 pb-1 overflow-hidden h-32"
          >
            {/* Title */}
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {card.title}
            </h3>

            {/* Value + Subtext */}
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-extrabold font-mono tracking-tight text-white leading-none">
                {card.value}
              </span>
              {card.subtext && (
                <span className="text-[11px] font-mono text-slate-500">{card.subtext}</span>
              )}
            </div>

            {/* Sparkline */}
            <div className="h-14 w-full mt-1 -mx-2 -mb-1 min-h-[56px] min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={card.sparkData.map(v => ({ v }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.color} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={[0, 'auto']} />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={card.color}
                    strokeWidth={2}
                    fill={`url(#spark-${card.id})`}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </section>

      {/* ════════════════════════════════════════════════════════════════
         ROW B — MAIN 3-COLUMN METRICS PANEL
         ════════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── COL 1: COMPOSED BAR + LINE CHART (5 cols) ────────────────── */}
        <div className="lg:col-span-5 bg-[#131c2e] border border-slate-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-[13px] font-bold text-white tracking-wide mb-4">
            Latencia y Throughput por Endpoint (Promedio)
          </h2>

          <div className="flex flex-1 gap-3">
            {/* Chart area */}
            <div className="flex-1 min-h-[290px] h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={endpointChartData}
                  margin={{ top: 40, right: 5, left: -15, bottom: 10 }}
                >
                  <XAxis
                    dataKey="path"
                    stroke="#475569"
                    fontSize={9}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                    tickFormatter={(val: string) => val.split("/").pop() || val}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#475569"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 350]}
                    ticks={[50, 100, 150, 200, 250, 300]}
                    tickFormatter={(v: number) => `${v}ms`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#f97316"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 30]}
                    ticks={[5, 10, 15, 20, 25, 30]}
                    tickFormatter={(v: number) => `${v} RPS`}
                  />
                  <RechartsTooltip content={<CustomComposedTooltip />} />
                  <Bar
                    yAxisId="left"
                    dataKey="avgMs"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={800}
                    barSize={40}
                    label={renderBarTopLabel}
                  >
                    {endpointChartData.map((entry: any, index: number) => (
                      <Cell key={`bar-${index}`} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rps"
                    stroke={C.orange}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: C.orange, strokeWidth: 2, stroke: "#131c2e" }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={true}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Endpoint scroll list (right panel) */}
            <div className="w-[140px] shrink-0 border-l border-slate-800 pl-3 overflow-y-auto max-h-[290px] space-y-1.5">
              {endpointChartData.map((ep: any, idx: number) => (
                <div
                  key={idx}
                  className="text-[10px] font-mono text-slate-400 hover:text-slate-200 cursor-default py-1 border-b border-slate-800/50 last:border-0 truncate"
                >
                  {ep.path}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COL 2: DONUT CHART — HTTP STATUS DISTRIBUTION (4 cols) ──── */}
        <div className="lg:col-span-4 bg-[#131c2e] border border-slate-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-[13px] font-bold text-white tracking-wide mb-3">
            Distribución de Estados HTTP (Resumen del Test)
          </h2>
              
          <div className="flex flex-1 items-center gap-4">
            {/* Donut */}
            <div className="relative flex-1 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={httpStatuses}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={800}
                    onMouseEnter={(_, idx) => setActiveSlice(httpStatuses[idx])}
                    onMouseLeave={() => setActiveSlice(null)}
                  >
                    {httpStatuses.map((entry, index) => (
                      <Cell
                        key={`slice-${index}`}
                        fill={entry.color}
                        stroke="#131c2e"
                        strokeWidth={3}
                        className="cursor-pointer"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[11px] font-bold text-slate-300 tracking-wide">
                  {displaySlice.name}
                </span>
                <span className="flex items-center gap-1 mt-0.5">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: displaySlice.color }}
                  />
                  <span className="text-sm font-bold font-mono text-white">
                    {displaySlice.percentage}%
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Counts: {displaySlice.value.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Legend (right-aligned) */}
            <div className="w-[110px] shrink-0 space-y-2.5">
              {httpStatuses.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setActiveSlice(item)}
                  onMouseLeave={() => setActiveSlice(null)}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-300 ml-auto">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COL 3: TTFB MAP (3 cols) ─────────────────────────────────── */}
        <div className="lg:col-span-3 bg-[#131c2e] border border-slate-800 rounded-xl p-5 flex flex-col">
          <h2 className="text-[13px] font-bold text-white tracking-wide italic mb-3">
            Time to First Byte (TTFB) map
          </h2>

          <div className="flex flex-1 items-center gap-3">
            {/* US Map */}
            <div className="flex-1 min-h-[200px] flex items-center justify-center opacity-90">
              <USMapSVG />
            </div>

            {/* TTFB Legend Scale */}
            <div className="w-[80px] shrink-0 space-y-0">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                Time to First Byte
              </div>
              {TTFB_LEGEND.map((item, i) => (
                <div key={i} className="flex items-center gap-2 py-[3px]">
                  <span
                    className="h-3 w-3 rounded-sm shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
