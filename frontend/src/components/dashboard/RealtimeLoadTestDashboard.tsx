"use client";

import React, { useState, useEffect, useMemo } from "react";
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
} from "recharts";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Activity,
  Globe,
  Users,
  Server,
  Filter,
  XCircle,
} from "lucide-react";

// ── COLOR PALETTE DEFINITION ──────────────────────────────────────────────────
const COLOR_CYAN = "#06b6d4";
const COLOR_BLUE = "#3b82f6";
const COLOR_RED = "#ef4444";
const COLOR_ORANGE = "#f97316";
const COLOR_GOLD = "#eab308";
const COLOR_GREEN = "#10b981";
const COLOR_PURPLE = "#8b5cf6";

// Initial endpoint mock data
const INITIAL_ENDPOINTS = [
  { id: "1", path: "v2/pokemon/ditto", avgMs: 145, rps: 85, color: COLOR_CYAN, successCount: 12540, failedCount: 50 },
  { id: "2", path: "v2/type/fire", avgMs: 210, rps: 62, color: COLOR_PURPLE, successCount: 8900, failedCount: 120 },
  { id: "3", path: "v2/ability/1", avgMs: 95, rps: 45, color: COLOR_GREEN, successCount: 15200, failedCount: 10 },
  { id: "4", path: "v2/item/potion", avgMs: 310, rps: 28, color: COLOR_ORANGE, successCount: 4100, failedCount: 200 },
  { id: "5", path: "v2/move/thunderbolt", avgMs: 180, rps: 30, color: COLOR_BLUE, successCount: 6500, failedCount: 30 },
];

// Initial HTTP status distribution
const INITIAL_HTTP_STATUSES = [
  { name: "HTTP 200 (OK)", code: "200", value: 125450, percentage: 95.1, color: "#10b981" },
  { name: "HTTP 404 (Not Found)", code: "404", value: 3960, percentage: 3.0, color: "#eab308" },
  { name: "HTTP 500 / 504 (Server Error)", code: "500", value: 2640, percentage: 1.9, color: "#ef4444" },
];

// Geographic TTFB map regions
const INITIAL_TTFB_REGIONS = [
  { id: "us-east", name: "EE. UU. Este (N. Virginia)", code: "US-E", ttfb: 17, min: 14, max: 28, status: "Excelente", colorClass: "from-emerald-500/20 to-emerald-600/30 border-emerald-500/40 text-emerald-400" },
  { id: "us-west", name: "EE. UU. Oeste (Oregón)", code: "US-W", ttfb: 42, min: 38, max: 65, status: "Excelente", colorClass: "from-emerald-500/20 to-emerald-600/30 border-emerald-500/40 text-emerald-400" },
  { id: "latam-br", name: "Sudamérica (São Paulo)", code: "SA-E", ttfb: 128, min: 110, max: 165, status: "Bueno", colorClass: "from-teal-500/20 to-emerald-500/30 border-teal-500/40 text-teal-300" },
  { id: "latam-mx", name: "México & Centroamérica", code: "MX-C", ttfb: 85, min: 72, max: 115, status: "Bueno", colorClass: "from-emerald-500/20 to-teal-600/30 border-emerald-500/40 text-emerald-400" },
  { id: "eu-central", name: "Europa Central (Fráncfort)", code: "EU-C", ttfb: 185, min: 160, max: 220, status: "Normal", colorClass: "from-amber-500/10 to-emerald-600/20 border-amber-500/30 text-amber-300" },
  { id: "apac-tokyo", name: "Asia Pacífico (Tokio)", code: "AP-N", ttfb: 620, min: 540, max: 710, status: "Elevado", colorClass: "from-red-500/20 to-amber-600/20 border-red-500/40 text-red-400" },
];

export default function RealtimeLoadTestDashboard() {
  // Real-time state controls
  const [isRunning, setIsRunning] = useState(true);
  const [virtualUsers, setVirtualUsers] = useState(225);
  const [selectedEndpointFilter, setSelectedEndpointFilter] = useState<string | null>(null);
  const [activeDonutSlice, setActiveDonutSlice] = useState<any>(null);

  // Live Metrics & History arrays for sparklines
  const [metricsHistory, setMetricsHistory] = useState(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      step: i,
      latency: 135 + Math.sin(i * 0.5) * 15 + Math.random() * 8,
      p95: 175 + Math.sin(i * 0.5) * 20 + Math.random() * 10,
      errorRate: Number((0.4 + Math.random() * 0.3).toFixed(2)),
      throughput: Math.round(240 + Math.random() * 25),
      vu: 225,
      successCount: 120000 + i * 220 + Math.round(Math.random() * 150),
      failedCount: 600 + i * 2 + Math.round(Math.random() * 3),
    }));
  });

  const [endpoints, setEndpoints] = useState(INITIAL_ENDPOINTS);
  const [httpStatuses] = useState(INITIAL_HTTP_STATUSES);
  const [regions, setRegions] = useState(INITIAL_TTFB_REGIONS);

  // Simulation Ticker
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setMetricsHistory((prev) => {
        const last = prev[prev.length - 1];
        const newStep = last.step + 1;
        const latencyVariation = (Math.random() - 0.48) * 12;
        const newLatency = Math.max(90, Math.min(280, Number((last.latency + latencyVariation).toFixed(1))));
        const newP95 = Number((newLatency * 1.24 + Math.random() * 5).toFixed(1));
        
        const errVar = (Math.random() - 0.5) * 0.1;
        const newErrRate = Number(Math.max(0.1, Math.min(2.5, last.errorRate + errVar)).toFixed(2));

        const throughputVar = (Math.random() - 0.49) * 15;
        const newThroughput = Math.max(150, Math.min(450, Math.round(last.throughput + throughputVar)));

        const addedSuccess = Math.round(newThroughput * 1.2);
        const addedFailed = Math.random() > 0.6 ? Math.round(Math.random() * 2) : 0;

        const nextPoint = {
          step: newStep,
          latency: newLatency,
          p95: newP95,
          errorRate: newErrRate,
          throughput: newThroughput,
          vu: virtualUsers,
          successCount: last.successCount + addedSuccess,
          failedCount: last.failedCount + addedFailed,
        };

        return [...prev.slice(1), nextPoint];
      });

      // Fluctuate endpoint numbers slightly
      setEndpoints((prev) =>
        prev.map((ep) => {
          const newSuccess = ep.successCount + Math.round(ep.rps * 1.2);
          const newFailed = ep.failedCount + (Math.random() > 0.8 ? Math.round(Math.random() * 2) : 0);
          return {
            ...ep,
            avgMs: Math.max(50, Math.round(ep.avgMs + (Math.random() - 0.5) * 8)),
            rps: Math.max(10, Math.round(ep.rps + (Math.random() - 0.5) * 4)),
            successCount: newSuccess,
            failedCount: newFailed,
          };
        })
      );

      // Fluctuate regional TTFB slightly
      setRegions((prev) =>
        prev.map((reg) => {
          const delta = (Math.random() - 0.5) * 4;
          const newTtfb = Math.max(reg.min, Math.min(reg.max, Math.round(reg.ttfb + delta)));
          return { ...reg, ttfb: newTtfb };
        })
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [isRunning, virtualUsers]);

  // Current latest values
  const current = metricsHistory[metricsHistory.length - 1];

  // Filtered endpoints for chart
  const filteredEndpoints = useMemo(() => {
    if (!selectedEndpointFilter) return endpoints;
    return endpoints.filter((e) => e.path === selectedEndpointFilter);
  }, [endpoints, selectedEndpointFilter]);

  // Get totals for when no filter is applied
  const totalSuccess = useMemo(() => endpoints.reduce((sum, ep) => sum + ep.successCount, 0), [endpoints]);
  const totalFailed = useMemo(() => endpoints.reduce((sum, ep) => sum + ep.failedCount, 0), [endpoints]);

  // Selected endpoint data
  const selectedEpData = useMemo(() => {
    if (!selectedEndpointFilter) return null;
    return endpoints.find((e) => e.path === selectedEndpointFilter) || null;
  }, [endpoints, selectedEndpointFilter]);

  // KPI card configs
  const kpiCards = [
    {
      id: "latency",
      title: "LATENCIA PROMEDIO",
      value: `${current.latency.toFixed(0)} ms`,
      subtext: `p95: ${current.p95.toFixed(0)} ms`,
      dataKey: "latency",
      color: COLOR_CYAN,
      gradientId: "grad-latency",
    },
    {
      id: "error",
      title: "TASA DE ERROR",
      value: `${current.errorRate.toFixed(2)}%`,
      subtext: current.errorRate > 1.0 ? "Atención requerida" : "Estable (<1%)",
      dataKey: "errorRate",
      color: COLOR_RED,
      gradientId: "grad-error",
    },
    {
      id: "throughput",
      title: "THROUGHPUT RPS",
      value: `${current.throughput.toLocaleString()}`,
      subtext: "req / seg",
      dataKey: "throughput",
      color: COLOR_ORANGE,
      gradientId: "grad-throughput",
    },
    {
      id: "vu",
      title: "USUARIOS VIRTUALES (VU)",
      value: `${virtualUsers}`,
      subtext: "Concurrencia activa",
      dataKey: "vu",
      color: COLOR_GOLD,
      gradientId: "grad-vu",
    },
    {
      id: "success",
      title: "SOLICITUDES EXITOSAS",
      value: `${(selectedEpData ? selectedEpData.successCount : totalSuccess).toLocaleString()}`,
      subtext: "HTTP 2xx",
      dataKey: "successCount",
      color: COLOR_GREEN,
      gradientId: "grad-success",
      // Sparkline needs update to show actual data if filtered or total. For now kept as is for history, but value is correct
    },
    {
      id: "failed",
      title: "SOLICITUDES FALLIDAS",
      value: `${(selectedEpData ? selectedEpData.failedCount : totalFailed).toLocaleString()}`,
      subtext: "HTTP 4xx / 5xx",
      dataKey: "failedCount",
      color: COLOR_RED,
      gradientId: "grad-failed",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 md:p-6 lg:p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-[1700px] mx-auto space-y-6">
        {/* ── HEADER / CONTROLS BAR ────────────────────────────────────────────── */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-[#131c2e] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg shadow-black/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Dashboard de Pruebas de Carga
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  EN TIEMPO REAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitorización en vivo de rendimiento, latencia y tráfico HTTP
              </p>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* VU Slider Control */}
            <div className="flex items-center gap-2 bg-[#1e293b]/70 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300 font-medium">VU:</span>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={virtualUsers}
                onChange={(e) => setVirtualUsers(Number(e.target.value))}
                className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-xs font-mono font-bold text-amber-400 w-8">
                {virtualUsers}
              </span>
            </div>

            {/* Live Play/Pause Toggle */}
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md ${
                isRunning
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Pausar Simulación
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Reanudar En Vivo
                </>
              )}
            </button>

            {/* Reset Simulation */}
            <button
              onClick={() => {
                setMetricsHistory((prev) =>
                  prev.map((pt) => ({
                    ...pt,
                    latency: 140 + Math.random() * 10,
                    throughput: 240,
                    errorRate: 0.5,
                  }))
                );
              }}
              className="p-2 bg-[#1e293b] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Reiniciar Métricas"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── ROW A: TOP 6 KPI CARDS GRID ──────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative bg-[#131c2e] border border-slate-800/90 rounded-xl p-4 overflow-hidden shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all group"
            >
              {/* Subtle top indicator bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: card.color }}
              />

              <div className="flex justify-between items-start mb-1 z-10 relative">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </h3>
              </div>

              <div className="z-10 relative">
                <div className="text-2xl font-bold font-mono tracking-tight text-white">
                  {card.value}
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                  {card.subtext}
                </div>
              </div>

              {/* Sparkline area chart */}
              <div className="h-16 w-full mt-2 -mb-2 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metricsHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={card.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={card.color} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey={card.dataKey}
                      stroke={card.color}
                      strokeWidth={2}
                      fill={`url(#${card.gradientId})`}
                      isAnimationActive={true}
                      animationDuration={400}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ── ROW B: MAIN METRICS PANEL (3 COLUMNS) ────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── COLUMN 1: COMPOSED CHART (LATENCY & THROUGHPUT PER ENDPOINT) [5 COLS] ── */}
          <div className="lg:col-span-5 bg-[#131c2e] border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/30 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/50 mb-6">
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">
                  Rendimiento por Endpoint
                </h2>
                <p className="text-xs text-slate-500 mt-1">Latencia media (ms) vs Throughput (RPS)</p>
              </div>

              {selectedEndpointFilter && (
                <button
                  onClick={() => setSelectedEndpointFilter(null)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/20 flex items-center gap-1.5 transition-colors"
                >
                  Limpiar filtro <XCircle className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Composed Chart */}
              <div className="md:col-span-3 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={filteredEndpoints}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <XAxis
                      dataKey="path"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#334155" }}
                      tickFormatter={(val) => val.split("/").pop() || val}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#334155" }}
                      unit="ms"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#f97316"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#334155" }}
                      unit=" rps"
                    />
                    <RechartsTooltip content={<CustomComposedTooltip />} />
                    <Bar yAxisId="left" dataKey="avgMs" radius={[6, 6, 0, 0]} isAnimationActive={true}>
                      {filteredEndpoints.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rps"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#131c2e" }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Internal Endpoint Selector Panel */}
              <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-3 space-y-2 max-h-[280px] overflow-y-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-cyan-400" /> Endpoints
                </div>
                {endpoints.map((ep) => {
                  const isSelected = selectedEndpointFilter === ep.path;
                  return (
                    <button
                      key={ep.id}
                      onClick={() =>
                        setSelectedEndpointFilter(isSelected ? null : ep.path)
                      }
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all border ${
                        isSelected
                          ? "bg-slate-800 border-cyan-500/50 text-cyan-300"
                          : "bg-[#1e293b]/50 border-slate-800 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono truncate text-[11px] font-semibold">
                          /{ep.path.split("/").pop()}
                        </span>
                        <div
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: ep.color }}
                        />
                      </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>{ep.avgMs} ms</span>
                <span className="text-orange-400 font-mono">{ep.rps} rps</span>
                <span className="text-emerald-400 font-mono font-bold">{ep.successCount.toLocaleString()}</span>
              </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── COLUMN 2: DONUT CHART (HTTP STATUS DISTRIBUTION) [3 COLS] ──────── */}
          <div className="lg:col-span-3 bg-[#131c2e] border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/30 flex flex-col justify-between">
            <div className="pb-4 border-b border-slate-800/50 mb-6">
              <h2 className="text-base font-semibold text-white tracking-tight">
                Distribución HTTP
              </h2>
              <p className="text-xs text-slate-500 mt-1">Resumen de respuestas del servidor</p>
            </div>

            {/* Donut Chart with Center Text overlay */}
            <div className="relative h-[210px] w-full flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={httpStatuses}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    isAnimationActive={true}
                    onMouseEnter={(_, idx) => setActiveDonutSlice(httpStatuses[idx])}
                    onMouseLeave={() => setActiveDonutSlice(null)}
                  >
                    {httpStatuses.map((entry, index) => (
                      <Cell
                        key={`slice-${index}`}
                        fill={entry.color}
                        stroke="#131c2e"
                        strokeWidth={3}
                        className="cursor-pointer transition-transform hover:scale-105"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {activeDonutSlice ? activeDonutSlice.code : "HTTP 200"}
                </span>
                <span className="text-xl font-bold font-mono text-white">
                  {activeDonutSlice
                    ? `${activeDonutSlice.percentage}%`
                    : `${httpStatuses[0].percentage}%`}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeDonutSlice
                    ? `${activeDonutSlice.value.toLocaleString()} req`
                    : `${httpStatuses[0].value.toLocaleString()} req`}
                </span>
              </div>
            </div>

            {/* Legend aligned right/stacked with dots */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              {httpStatuses.map((item) => (
                <div
                  key={item.code}
                  onMouseEnter={() => setActiveDonutSlice(item)}
                  onMouseLeave={() => setActiveDonutSlice(null)}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white block">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── COLUMN 3: TTFB GEOGRAPHIC MAP & HEATMAP [4 COLS] ────────────────── */}
          <div className="lg:col-span-4 bg-[#131c2e] border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/30 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/50 mb-6">
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  TTFB Regional
                </h2>
                <p className="text-xs text-slate-500 mt-1">Latencia a primer byte por región</p>
              </div>
            </div>

            {/* Regional TTFB Heatmap Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
              {regions.map((reg) => (
                <div
                  key={reg.id}
                  className={`bg-gradient-to-br ${reg.colorClass} border rounded-xl p-3 shadow-sm hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold font-mono uppercase bg-slate-900/60 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700/50">
                      {reg.code}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/40">
                      {reg.status}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="text-xl font-bold font-mono tracking-tight">
                      {reg.ttfb}{" "}
                      <span className="text-xs font-normal opacity-80">ms</span>
                    </div>
                    <div className="text-[11px] font-medium truncate opacity-90 mt-0.5">
                      {reg.name}
                    </div>
                  </div>

                  {/* Range indicator bar */}
                  <div className="mt-2 pt-1.5 border-t border-white/10 flex justify-between text-[9px] font-mono opacity-75">
                    <span>min: {reg.min}ms</span>
                    <span>max: {reg.max}ms</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Regional Latency Summary Footer */}
            <div className="p-3 bg-[#1e293b]/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs mt-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-medium">Nodos Globales:</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">6 Nodos Activos</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── CUSTOM FLOATING TOOLTIP FOR COMPOSED CHART ────────────────────────────────
function CustomComposedTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[180px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <span className="font-mono font-bold text-cyan-300 truncate max-w-[150px]">
          /{data.path}
        </span>
      </div>

      <div className="flex justify-between items-center text-slate-300">
        <span className="text-slate-400">Latencia Promedio (Avg):</span>
        <span className="font-mono font-bold text-white">{data.avgMs} ms</span>
      </div>

      <div className="flex justify-between items-center text-slate-300">
        <span className="text-slate-400">Throughput (RPS):</span>
        <span className="font-mono font-bold text-orange-400">{data.rps} rps</span>
      </div>
    </div>
  );
}
