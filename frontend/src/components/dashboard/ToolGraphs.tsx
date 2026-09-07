"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";

export function ToolGraphs({ history }: { history: any[] }) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Datos procesados para las gráficas
  const displayData = history.length > 0 
    ? history.map(item => ({ ...item, latency: typeof item.latency === 'object' ? item.latency.avg : item.latency })) 
    : Array(20).fill({ latency: 0, errorRate: 0, throughput: 0, concurrency: 0, successful: 0, failed: 0, step: 0 });

  const charts = [
    { title: "Latencia", dataKey: "latency", color: "#38bdf8" },
    { title: "Error", dataKey: "errorRate", color: "#ef4444" },
    { title: "Throughput", dataKey: "throughput", color: "#a855f7" },
    { title: "VU", dataKey: "concurrency", color: "#fbbf24" },
    { title: "Exitosas", dataKey: "successful", color: "#10b981" },
    { title: "Fallidas", dataKey: "failed", color: "#f43f5e" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {charts.map((chart) => (
        <motion.div
          key={chart.dataKey}
          className={`relative p-4 rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="flex justify-between items-start mb-2 z-10 relative">
            <h3 className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{chart.title}</h3>
            <span className="text-lg font-mono font-bold tabular-nums" style={{color: chart.color}}>
              {displayData[displayData.length - 1][chart.dataKey]?.toFixed(1) ?? 0}
            </span>
          </div>
          
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData}>
                <defs>
                  <linearGradient id={`gradient-${chart.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.color} stopOpacity={0.3}/>
                    <stop offset="100%" stopColor={chart.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
                  }}
                  itemStyle={{ color: chart.color, fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey={chart.dataKey} 
                  stroke={chart.color} 
                  strokeWidth={2}
                  fill={`url(#gradient-${chart.dataKey})`}
                  isAnimationActive={true}
                  animationDuration={300}
                  dot={{ r: 2, fill: chart.color, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: chart.color }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Fondo sutil tipo brillo */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 100% 0%, ${chart.color}10, transparent 50%)` }} />
        </motion.div>
      ))}
    </div>
  );
}
