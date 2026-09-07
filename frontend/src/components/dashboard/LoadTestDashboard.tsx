"use client";

import React, { useState, useEffect } from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useTheme } from "@/lib/theme-context";

interface MetricLatency {
  avg?: number;
  p95?: number;
}

interface LiveMetrics {
  latency?: MetricLatency;
  errorRate?: number;
  throughput?: number;
  concurrency?: number;
  successful?: number;
  failed?: number;
  ttfb?: number;
}

interface EndpointItem {
  endpoint: string;
  latency?: number | MetricLatency;
  totalReqs?: number;
  status?: string;
  configSnapshot?: { duration?: number };
  rps?: number;
}

interface LoadTestDashboardProps {
  liveMetrics: LiveMetrics;
  testEndpoints?: EndpointItem[];
  isRunning?: boolean;
}

const BUFFER_SIZE = 15;

export default function LoadTestDashboard({ liveMetrics, testEndpoints = [], isRunning: propIsRunning }: LoadTestDashboardProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  const isRunning = propIsRunning ?? Boolean(testEndpoints?.length > 0 && liveMetrics);
  const hasMetrics = liveMetrics && Object.keys(liveMetrics).length > 0;
  const shouldShowMetrics = isRunning || hasMetrics;
  const d = liveMetrics || {};

  // Buffers de historial para los sparklines (15 puntos para una onda más fluida)
  const [history, setHistory] = useState<Record<string, number[]>>({
    lat: Array(BUFFER_SIZE).fill(0),
    err: Array(BUFFER_SIZE).fill(0),
    tp: Array(BUFFER_SIZE).fill(0),
    vu: Array(BUFFER_SIZE).fill(0),
    ok: Array(BUFFER_SIZE).fill(0),
    fail: Array(BUFFER_SIZE).fill(0),
  });

  // Animación continua y reactiva de onda para TTFB
  const [wavePhase, setWavePhase] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      setWavePhase(prev => (prev + 0.04) % (Math.PI * 2));
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Efecto reactivo puro: Sincroniza todos los buffers al mismo tiempo cuando entra liveMetrics
  useEffect(() => {
    const latVal = liveMetrics?.latency?.avg ?? 0;
    const errVal = liveMetrics?.errorRate ?? 0;
    const tpVal = liveMetrics?.throughput ?? 0;
    const vuVal = liveMetrics?.concurrency ?? 0;
    const okVal = liveMetrics?.successful ?? 0;
    const failVal = liveMetrics?.failed ?? 0;

    setHistory(prev => ({
      lat: [...prev.lat.slice(1), latVal],
      err: [...prev.err.slice(1), errVal],
      tp: [...prev.tp.slice(1), tpVal],
      vu: [...prev.vu.slice(1), vuVal],
      ok: [...prev.ok.slice(1), okVal],
      fail: [...prev.fail.slice(1), failVal],
    }));
  }, [
    liveMetrics?.latency?.avg,
    liveMetrics?.errorRate,
    liveMetrics?.throughput,
    liveMetrics?.concurrency,
    liveMetrics?.successful,
    liveMetrics?.failed
  ]);

  // KPIs Superiores
  const kpiData = [
    { title: "LATENCIA PROM.", value: shouldShowMetrics ? `${(d.latency?.avg || 0).toFixed(0)} ms` : "0 ms", sub: shouldShowMetrics ? `(p95: ${(d.latency?.p95 || 0).toFixed(0)})` : "", color: "#06b6d4", gradId: "g-lat", data: history.lat },
    { title: "TASA DE ERROR", value: shouldShowMetrics ? `${(d.errorRate || 0).toFixed(1)}%` : "0.0%", sub: "", color: "#ef4444", gradId: "g-err", data: history.err },
    { title: "THROUGHPUT RPS", value: shouldShowMetrics ? `${(d.throughput || 0).toFixed(0)}` : "0", sub: "", color: "#f97316", gradId: "g-tp", data: history.tp },
    { title: "USUARIOS (VU)", value: shouldShowMetrics ? `${d.concurrency || 0}` : "0", sub: "", color: "#eab308", gradId: "g-vu", data: history.vu },
    { title: "SOLICITUDES OK", value: shouldShowMetrics ? `${(d.successful || 0).toLocaleString()}` : "0", sub: "", color: "#10b981", gradId: "g-ok", data: history.ok },
    { title: "SOLICITUDES FALLIDAS", value: shouldShowMetrics ? `${(d.failed || 0).toLocaleString()}` : "0", sub: "", color: "#ef4444", gradId: "g-fail", data: history.fail },
  ];

  // Datos dinámicos para gráfico de endpoints
  const endpointData = shouldShowMetrics && testEndpoints.length > 0 ? testEndpoints.map(ep => {
    const rawLat = typeof ep.latency === 'number' ? ep.latency : (ep.latency?.avg || 0);
    const calculatedRps = ep.rps ?? ((ep.totalReqs || 0) / (ep.configSnapshot?.duration || 10));
    return {
      name: ep.endpoint?.split('/').filter(Boolean).pop() || ep.endpoint || 'ep',
      latency: Math.round(rawLat),
      rps: Number(calculatedRps.toFixed(1)),
      color: ep.status === 'error' || rawLat > 1000 ? '#ef4444' : '#3b82f6'
    };
  }) : [
    { name: 'ep-1', latency: 0, rps: 0, color: t('#334155', '#cbd5e1') },
    { name: 'ep-2', latency: 0, rps: 0, color: t('#334155', '#cbd5e1') },
    { name: 'ep-3', latency: 0, rps: 0, color: t('#334155', '#cbd5e1') },
  ];

  // Distribución dinámica real de Estados HTTP
  const totalReqs = (d.successful || 0) + (d.failed || 0);
  const okPct = totalReqs > 0 ? ((d.successful || 0) / totalReqs * 100).toFixed(1) : '0.0';
  const failPct = totalReqs > 0 ? ((d.failed || 0) / totalReqs * 100).toFixed(1) : '0.0';

  const statusData = shouldShowMetrics && totalReqs > 0 ? [
    { name: `2xx OK (${okPct}%)`, value: d.successful || 0, color: '#10b981' },
    { name: `4xx/5xx Err (${failPct}%)`, value: d.failed || 0, color: '#ef4444' },
  ] : [
    { name: 'Sin Actividad', value: 1, color: t('#334155', '#e2e8f0') },
  ];

  // Cálculo de TTFB promedio dinámico
  const currentTTFB = shouldShowMetrics ? (d.ttfb || Math.round((d.latency?.avg || 0) * 0.4)) : 0;
  const ttfbColor = currentTTFB > 300 ? '#ef4444' : currentTTFB > 150 ? '#f59e0b' : '#10b981';

  return (
    <div
      className={`${t(
        'bg-[#050b14] text-slate-200',
        'bg-slate-50 text-slate-800'
      )} min-h-full p-4 md:p-5 font-sans rounded-2xl overflow-hidden`}
    >
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${t('bg-cyan-500/10 border-cyan-400/20', 'bg-cyan-50 border-cyan-200')}`}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 17V7l8-4 8 4v10l-8 4-8-4Z" />
                <path d="m8 9 4-2 4 2v6l-4 2-4-2V9Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl md:text-2xl font-black tracking-tight ${t('text-white', 'text-slate-900')}`}>
                  API Performance Monitor
                </h2>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black tracking-wider ${isRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : t('bg-slate-800 text-slate-400 border-slate-700', 'bg-slate-200 text-slate-500 border-slate-300')} border`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {isRunning ? 'LIVE' : 'IDLE'}
                </span>
              </div>
              <div className={`text-[10px] mt-1 ${t('text-slate-500', 'text-slate-500')}`}>
                Panel de observabilidad · Métricas de carga en tiempo real
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`h-9 px-3 rounded-lg border flex items-center gap-2 text-[10px] font-semibold ${t('bg-slate-900 border-slate-800 text-slate-300', 'bg-white border-slate-200 text-slate-600')}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Producción
          </div>
          <div className={`h-9 px-3 rounded-lg border flex items-center gap-2 text-[10px] font-semibold ${t('bg-slate-900 border-slate-800 text-slate-300', 'bg-white border-slate-200 text-slate-600')}`}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7v5l3 2" />
            </svg>
            Tiempo real
          </div>
          <div className={`h-9 px-3 rounded-lg border flex items-center gap-2 text-[10px] ${t('bg-slate-900 border-slate-800 text-slate-400', 'bg-white border-slate-200 text-slate-500')}`}>
            Última actualización
            <span className="font-mono font-bold">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        {kpiData.map((kpi, i) => {
          // Generación de curva sparkline orgánica y en vivo
          const ptsCount = 16;
          const minVal = Math.min(...kpi.data);
          const maxVal = Math.max(...kpi.data);
          const range = maxVal - minVal || 1;
          const isAllZero = kpi.data.every(v => v === 0);

          // Si hay prueba corriendo o datos, genera una curva fluida con wavePhase
          const pts = Array.from({ length: ptsCount }, (_, idx) => {
            const x = (idx / (ptsCount - 1)) * 200;
            const normIdx = idx / (ptsCount - 1);
            
            // Valor base histórico o simulación orgánica
            let baseNorm = 0.5;
            if (!isAllZero) {
              const dataIdx = Math.min(Math.floor(normIdx * (kpi.data.length - 1)), kpi.data.length - 1);
              baseNorm = (kpi.data[dataIdx] - minVal) / range;
            }

            // Factor de ondulación en vivo (sólo cuando la prueba está corriendo y hay datos reales)
            const hasKpiData = isRunning || (!isAllZero && hasMetrics);
            const waveOffset = (i * 0.9); // desfase por cada tarjeta
            const waveAmp = isRunning ? (isAllZero ? 0 : 5) : 0;
            const liveSine = hasKpiData && isRunning ? Math.sin(normIdx * Math.PI * 3 - wavePhase + waveOffset) * waveAmp : 0;

            let y = isAllZero || (!hasKpiData && !isRunning)
              ? 48 
              : 42 - (baseNorm * 26) + liveSine;
            
            y = Math.max(6, Math.min(48, y));
            return { x, y };
          });

          let pointsStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          const fillPoints = `0,50 ${pointsStr} 200,50`;

          return (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl border p-3.5 h-[122px] group transition-all duration-300 hover:-translate-y-0.5 ${t(
                'bg-[#0a1420] border-slate-800/90 hover:border-slate-700',
                'bg-white border-slate-200 hover:border-slate-300'
              )}`}
            >
              <div className="relative z-10">
                <div className={`flex items-center justify-between text-[9px] font-black tracking-[0.14em] ${t('text-slate-500', 'text-slate-500')}`}>
                  <span>{kpi.title}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${isRunning ? 'animate-ping' : ''}`}
                    style={{ backgroundColor: kpi.color, boxShadow: `0 0 10px ${kpi.color}` }}
                  />
                </div>

                <div className={`mt-2 text-2xl font-black font-mono tracking-tight ${t('text-white', 'text-slate-900')}`}>
                  {kpi.value}
                </div>

                {kpi.sub && (
                  <div className={`text-[9px] mt-0.5 font-mono ${t('text-slate-500', 'text-slate-400')}`}>
                    {kpi.sub}
                  </div>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 h-14 opacity-90 pointer-events-none">
                <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`modern-${kpi.gradId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={kpi.color} stopOpacity={isRunning ? 0.38 : 0.18} />
                      <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <polygon points={fillPoints} fill={`url(#modern-${kpi.gradId})`} />
                  <polyline
                    fill="none"
                    stroke={kpi.color}
                    strokeWidth={isRunning ? "2.5" : "1.8"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsStr}
                  />
                  {isRunning && pts.length > 0 && (
                    <circle
                      cx={pts[pts.length - 1].x}
                      cy={pts[pts.length - 1].y}
                      r="3.5"
                      fill={kpi.color}
                    />
                  )}
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* ENDPOINT PERFORMANCE */}
        <section className={`xl:col-span-7 rounded-2xl border p-4 min-h-[410px] ${t(
          'bg-[#09131f] border-slate-800/90',
          'bg-white border-slate-200'
        )}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold ${t('text-white', 'text-slate-900')}`}>
                  Rendimiento por Endpoint
                </h3>
                <span className={`text-[14px] px-2 py-0.5 rounded-full ${t('bg-cyan-400/10 text-cyan-300', 'bg-cyan-50 text-cyan-600')}`}>
                  LIVE
                </span>
              </div>
              <p className={`text-[14px] mt-1 ${t('text-slate-500', 'text-slate-400')}`}>
                Latencia promedio vs solicitudes por segundo
              </p>
            </div>

            <div className={`px-2.5 py-1.5 rounded-lg border text-[9px] ${t(
              'bg-slate-950 border-slate-800 text-slate-400',
              'bg-slate-50 border-slate-200 text-slate-500'
            )}`}>
              {testEndpoints.length || 0} endpoints activos
            </div>
          </div>

          <div className="flex items-center gap-5 mb-2">
            <div className="flex items-center gap-2 text-[14px] font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
              Latencia (ms)
            </div>
            <div className="flex items-center gap-2 text-[14px] font-semibold">
              <span className="w-5 h-0.5 bg-cyan-400 relative">
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400" />
              </span>
              Throughput (RPS)
            </div>
          </div>

          <div className="h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={endpointData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="endpointBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke={t('#475569', '#94a3b8')}
                  fontSize={14}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke={t('#475569', '#94a3b8')}
                  fontSize={14}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={t('#475569', '#94a3b8')}
                  fontSize={14}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  cursor={{ fill: t('#ffffff', '#0f172a'), opacity: 0.03 }}
                  contentStyle={{
                    backgroundColor: t('#07111c', '#ffffff'),
                    borderColor: t('#243447', '#e2e8f0'),
                    borderRadius: '10px',
                    fontSize: '14px',
                    boxShadow: '0 12px 30px rgba(0,0,0,.25)'
                  }}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="latency"
                  barSize={28}
                  minPointSize={8}
                  radius={[6, 6, 2, 2]}
                  fill="url(#endpointBars)"
                  isAnimationActive={false}
                >
                  {endpointData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color === '#ef4444' ? '#ef4444' : 'url(#endpointBars)'}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rps"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={{ fill: '#22d3ee', stroke: '#07111c', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className={`mt-1 pt-3 border-t flex flex-wrap gap-x-5 gap-y-2 text-[14px] ${t('border-slate-800 text-slate-500', 'border-slate-200 text-slate-400')}`}>
            <span>Actualización sincronizada con el stream de métricas</span>
            <span className="font-mono">{isRunning ? '● STREAMING' : '○ SIN STREAM'}</span>
          </div>
        </section>

        {/* HTTP STATUS */}
        <section className={`xl:col-span-5 rounded-2xl border p-4 min-h-[410px] ${t(
          'bg-[#09131f] border-slate-800/90',
          'bg-white border-slate-200'
        )}`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-md font-bold ${t('text-white', 'text-slate-900')}`}>
                Distribución de Estados HTTP
              </h3>
              <p className={`text-[14px] mt-1 ${t('text-slate-500', 'text-slate-400')}`}>
                Resultado acumulado de las solicitudes recibidas
              </p>
            </div>
            <span className={`text-[12px] rounded-lg border px-2 py-1 ${t('border-slate-800 text-slate-500', 'border-slate-200 text-slate-500')}`}>
              Tiempo real
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_150px] gap-3 items-center mt-2">
            <div className="relative h-[285px] min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={72}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="transparent"
                    isAnimationActive={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-[10px] uppercase tracking-widest ${t('text-slate-500', 'text-slate-400')}`}>
                  Total Requests
                </span>
                <span className={`text-2xl font-black font-mono mt-1 ${t('text-white', 'text-slate-900')}`}>
                  {totalReqs.toLocaleString()}
                </span>
                <span className={`text-[14px] mt-1 ${t('text-slate-500', 'text-slate-400')}`}>
                  solicitudes
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {statusData.map((entry, index) => {
                const pct = totalReqs > 0
                  ? ((entry.value / totalReqs) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className={`text-[14px] font-semibold ${t('text-slate-300', 'text-slate-600')}`}>
                          {entry.name.split(' (')[0]}
                        </span>
                      </div>
                      <span className={`text-[14px] font-mono ${t('text-slate-400', 'text-slate-500')}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${t('bg-slate-800', 'bg-slate-100')}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(Number(pct), 100)}%`, backgroundColor: entry.color }}
                      />
                    </div>
                    <div className={`text-[14px] mt-1 font-mono ${t('text-slate-500', 'text-slate-400')}`}>
                      {entry.value.toLocaleString()} req
                    </div>
                  </div>
                );
              })}

              <div className={`mt-4 pt-3 border-t ${t('border-slate-800', 'border-slate-200')}`}>
                <div className={`text-[13px] uppercase tracking-wider ${t('text-slate-500', 'text-slate-400')}`}>
                  Tasa de error
                </div>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-xl font-black font-mono text-red-400">
                    {(d.errorRate || 0).toFixed(1)}%
                  </span>
                  <span className="text-[13px] text-emerald-400 mb-1">
                    {isRunning ? '● monitoreando' : '○ detenido'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TTFB */}
        <section className={`xl:col-span-4 rounded-2xl border p-4 min-h-[280px] ${t(
          'bg-[#09131f] border-slate-800/90',
          'bg-white border-slate-200'
        )}`}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className={`text-md font-bold ${t('text-white', 'text-slate-900')}`}>
                TTFB · Time To First Byte
              </h3>
              <p className={`text-[14px] mt-1 ${t('text-slate-500', 'text-slate-400')}`}>
                Tiempo estimado de respuesta inicial
              </p>
            </div>
            <span
              className="text-xl font-black font-mono"
              style={{ color: ttfbColor }}
            >
              {isRunning || currentTTFB > 0 ? `${currentTTFB} ms` : '--'}
            </span>
          </div>

          <div className="relative h-[185px] mt-2 overflow-hidden rounded-xl">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, ${ttfbColor} 0, transparent 45%)`
              }}
            />

            {(() => {
              // Si no hay datos ni prueba corriendo, la gráfica está plana en cero
              const hasActiveData = (isRunning || (hasMetrics && currentTTFB > 0));
              const pointsCount = 40;
              const width = 600;
              const height = 240;
              const startX = 20;
              const endX = 580;
              const step = (endX - startX) / (pointsCount - 1);
              
              const baselineY = hasActiveData ? 135 : 220; // En cero reposa abajo
              const amplitude1 = hasActiveData ? 18 : 0;
              const amplitude2 = hasActiveData ? 10 : 0;
              
              const pts = Array.from({ length: pointsCount }, (_, i) => {
                const x = startX + i * step;
                const normX = i / (pointsCount - 1);
                const y = hasActiveData
                  ? baselineY 
                    + Math.sin(normX * Math.PI * 4 - wavePhase) * amplitude1
                    + Math.cos(normX * Math.PI * 2 + wavePhase * 0.8) * amplitude2
                  : baselineY;
                return { x, y };
              });

              let pathD = `M ${pts[0].x} ${pts[0].y}`;
              for (let i = 1; i < pts.length; i++) {
                const prev = pts[i - 1];
                const curr = pts[i];
                const midX = (prev.x + curr.x) / 2;
                const midY = (prev.y + curr.y) / 2;
                pathD += ` Q ${prev.x} ${prev.y}, ${midX} ${midY}`;
              }
              pathD += ` T ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
              const areaD = `${pathD} L ${endX} ${height} L ${startX} ${height} Z`;

              // Puntos guía que flotan sobre la onda viva sólo cuando hay actividad
              const sampleIndices = [4, 11, 19, 26, 33, 38];
              const sampleDots = hasActiveData ? sampleIndices.map(idx => pts[idx]) : [];

              return (
                <svg viewBox="0 0 600 240" className="absolute inset-0 w-full h-full opacity-90">
                  <defs>
                    <pattern id="ttfbGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M30 0H0V30" fill="none" stroke="currentColor" strokeOpacity=".08" />
                    </pattern>
                    <linearGradient id="ttfbAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={hasActiveData ? ttfbColor : '#475569'} stopOpacity={hasActiveData ? 0.25 : 0.05} />
                      <stop offset="100%" stopColor={hasActiveData ? ttfbColor : '#475569'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <rect width="600" height="240" fill="url(#ttfbGrid)" className={t('text-slate-300', 'text-slate-500')} />
                  
                  {/* Área degradada debajo de la curva */}
                  <path
                    d={areaD}
                    fill="url(#ttfbAreaGrad)"
                  />

                  {/* Línea principal */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={hasActiveData ? ttfbColor : (isDarkMode ? '#334155' : '#cbd5e1')}
                    strokeWidth={hasActiveData ? "3" : "1.5"}
                    strokeLinecap="round"
                    strokeDasharray={hasActiveData ? undefined : "4 4"}
                    className="transition-colors duration-300"
                  />

                  {/* Puntos pulsantes dinámicos a lo largo de la onda */}
                  {sampleDots.map((dot, index) => (
                    <g key={index}>
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r="6"
                        fill={ttfbColor}
                        opacity="0.3"
                      />
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r="3.5"
                        fill={ttfbColor}
                      />
                    </g>
                  ))}
                </svg>
              );
            })()}

            <div className="absolute left-3 top-3">
              <span
                className="inline-flex rounded-md px-2 py-1 text-[9px] font-black"
                style={{
                  color: (isRunning || currentTTFB > 0) ? ttfbColor : '#64748b',
                  backgroundColor: (isRunning || currentTTFB > 0) ? `${ttfbColor}18` : (isDarkMode ? '#1e293b' : '#f1f5f9')
                }}
              >
                {(isRunning || currentTTFB > 0)
                  ? (currentTTFB > 300 ? 'ALTA LATENCIA' : currentTTFB > 150 ? 'LATENCIA MEDIA' : 'ÓPTIMO')
                  : 'EN ESPERA'}
              </span>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[8px] font-mono text-slate-500">
              <span>-30s</span>
              <span>-20s</span>
              <span>-10s</span>
              <span>AHORA</span>
            </div>
          </div>
        </section>

        {/* LIVE ENDPOINT TABLE */}
        <section className={`xl:col-span-8 rounded-2xl border p-4 min-h-[280px] ${t(
          'bg-[#09131f] border-slate-800/90',
          'bg-white border-slate-200'
        )}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className={`text-md font-bold ${t('text-white', 'text-slate-900')}`}>
                Endpoints en Tiempo Real
              </h3>
              <p className={`text-[14px] mt-1 ${t('text-slate-500', 'text-slate-400')}`}>
                Estado y rendimiento de cada ruta durante la prueba
              </p>
            </div>

            <div className={`px-3 py-2 rounded-lg border text-[10px] ${t(
              'bg-slate-950 border-slate-800 text-slate-500',
              'bg-slate-50 border-slate-200 text-slate-500'
            )}`}>
              STREAM DE MÉTRICAS ACTIVO
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className={`border-b text-[14px] uppercase tracking-wider ${t('border-slate-800 text-slate-600', 'border-slate-200 text-slate-400')}`}>
                  <th className="pb-2 font-bold">Endpoint</th>
                  <th className="pb-2 font-bold">Requests</th>
                  <th className="pb-2 font-bold">Latencia</th>
                  <th className="pb-2 font-bold">RPS</th>
                  <th className="pb-2 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {testEndpoints.slice(0, 6).map((ep, index) => {
                  const rawLat = typeof ep.latency === 'number'
                    ? ep.latency
                    : (ep.latency?.avg || 0);
                  const rps = ep.rps ?? ((ep.totalReqs || 0) / (ep.configSnapshot?.duration || 10));
                  const isError = ep.status === 'error' || rawLat > 1000;

                  return (
                    <tr
                      key={`${ep.endpoint}-${index}`}
                      className={`border-b last:border-0 transition-colors ${t('border-slate-800/70 hover:bg-slate-800/30', 'border-slate-100 hover:bg-slate-50')}`}
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          <span className={`text-[13px] font-mono font-bold ${t('text-slate-200', 'text-slate-700')}`}>
                            {ep.endpoint}
                          </span>
                        </div>
                      </td>
                      <td className={`py-2.5 text-[13px] font-mono ${t('text-slate-300', 'text-slate-600')}`}>
                        {(ep.totalReqs || 0).toLocaleString()}
                      </td>
                      <td className={`py-2.5 text-[13px] font-mono font-bold ${isError ? 'text-red-400' : 'text-cyan-400'}`}>
                        {Math.round(rawLat)} ms
                      </td>
                      <td className={`py-2.5 text-[13px] font-mono ${t('text-slate-300', 'text-slate-600')}`}>
                        {Number(rps || 0).toFixed(1)}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex rounded-md px-2 py-1 text-[8px] font-black uppercase ${
                          isError
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isError ? 'ERROR' : (ep.status || '200 OK')}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {testEndpoints.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`py-10 text-center text-[10px] ${t('text-slate-600', 'text-slate-400')}`}>
                      Sin endpoints disponibles. Inicia una prueba para comenzar el streaming.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
