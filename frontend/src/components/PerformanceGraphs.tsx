"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "@/lib/theme-context";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false }) as any;

export interface TestResultData {
  endpoints: Array<{ url: string; status: "success" | "error"; latency: number; statusCode?: number }>;
}

export function PerformanceGraphs({ results, toolName }: { results: TestResultData | null; toolName: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  useEffect(() => setMounted(true), []);
  if (!results) return null;

  const getChartOptions = (color: string, title: string): ApexOptions => ({
    chart: { type: 'bar', toolbar: { show: false }, animations: { enabled: false }, foreColor: isDarkMode ? '#94a3b8' : '#64748b' },
    colors: [color],
    title: { text: title, style: { color: isDarkMode ? '#f8fafc' : '#0f172a' } },
    xaxis: { 
        categories: results.endpoints.map(e => e.url),
        labels: { style: { colors: isDarkMode ? '#94a3b8' : '#64748b' } }
    },
    yaxis: { labels: { style: { colors: isDarkMode ? '#94a3b8' : '#64748b' } } },
    grid: { borderColor: isDarkMode ? '#334155' : '#e2e8f0' }
  });

  const statusCodeCounts = results.endpoints.reduce((acc, e) => {
    const code = e.statusCode || 0;
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <div className={`p-6 rounded-3xl border ${t('bg-slate-900 border-slate-800', 'bg-white border-slate-200')}`}>
        {mounted ? (
          <Chart 
              options={getChartOptions('#38bdf8', 'Latencia por Endpoint (ms)')} 
              series={[{ name: 'Latencia', data: results.endpoints.map(e => e.latency) }]} 
              type="bar" height={300} 
          />
        ) : (
          <div className={`h-[300px] w-full animate-pulse rounded-2xl ${t('bg-slate-800', 'bg-slate-200')}`} />
        )}
      </div>
      
      <div className={`p-6 rounded-3xl border ${t('bg-slate-900 border-slate-800', 'bg-white border-slate-200')}`}>
        <h4 className={`text-sm font-semibold mb-4 ${t('text-slate-400', 'text-slate-500')}`}>Distribución de Estados HTTP</h4>
        <div className="flex gap-4">
            {Object.entries(statusCodeCounts).map(([code, count]) => {
                const isSuccess = Number(code) >= 200 && Number(code) < 300;
                const isError = Number(code) >= 400;
                return (
                    <div key={code} className={`p-4 rounded-xl ${isSuccess ? t('bg-emerald-900/30 text-emerald-400', 'bg-emerald-500/10 text-emerald-600') : isError ? t('bg-red-900/30 text-red-400', 'bg-red-500/10 text-red-600') : t('bg-amber-900/30 text-amber-400', 'bg-amber-500/10 text-amber-600')}`}>
                        <div className="text-2xl font-bold">{code}</div>
                        <div className="text-xs">{count} solicitudes</div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
