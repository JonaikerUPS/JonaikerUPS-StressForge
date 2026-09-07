import React, { useState } from 'react';
import { Globe } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { translateLog } from '@/lib/log-translator';

export { generatePDF, generateEndpointPDF } from './pdfHelpers';

interface GeneralSummaryReportProps {
  reportData: {
    tool: string;
    totalEndpoints: number;
    overallAvgLatency: number | { avg: number };
    overallSuccessRate: number;
    totalRequests: number;
    endpoints: any[];
    logs: string;
    rawOutput?: string;
    percentiles?: Record<string, number>;
    requestStats?: any[];
  };
}

export const GeneralSummaryReport = ({ reportData }: GeneralSummaryReportProps) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;
  const [isTranslated, setIsTranslated] = useState(false);

  const avgLatency = (typeof reportData.overallAvgLatency === 'object' ? (reportData.overallAvgLatency as any)?.avg : reportData.overallAvgLatency) ?? 0;
  
  return (
    <div className={`border rounded-3xl p-6 shadow-sm ${t('border-slate-800 bg-slate-900', 'border-slate-200 bg-white')}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📊 Resumen General</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${t('bg-slate-950', 'bg-slate-100')}`}>
          <p className={`text-xs uppercase ${t('text-slate-400', 'text-slate-500')}`}>Endpoints</p>
          <p className="text-xl font-bold">{reportData.totalEndpoints}</p>
        </div>
        <div className={`p-4 rounded-xl ${t('bg-slate-950', 'bg-slate-100')}`}>
          <p className={`text-xs uppercase ${t('text-slate-400', 'text-slate-500')}`}>Latencia Prom.</p>
          <p className="text-xl font-bold">{avgLatency.toFixed(2)}ms</p>
        </div>
        <div className={`p-4 rounded-xl ${t('bg-slate-950', 'bg-slate-100')}`}>
          <p className={`text-xs uppercase ${t('text-slate-400', 'text-slate-500')}`}>Éxito</p>
          <p className="text-xl font-bold text-emerald-500">{reportData.overallSuccessRate}%</p>
        </div>
        <div className={`p-4 rounded-xl ${t('bg-slate-950', 'bg-slate-100')}`}>
          <p className={`text-xs uppercase ${t('text-slate-400', 'text-slate-500')}`}>Total Req.</p>
          <p className="text-xl font-bold">{(reportData.totalRequests ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {reportData.percentiles && (
        <div className="mt-6">
          <h3 className="text-md font-bold mb-2">📊 Percentiles de Latencia (ms)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(reportData.percentiles).map(([p, val]) => (
              <div key={p} className={`p-2 rounded text-center ${t('bg-slate-800', 'bg-slate-100')}`}>
                <span className={`text-[10px] uppercase ${t('text-slate-400', 'text-slate-500')}`}>{p}</span>
                <p className="font-mono font-bold">{val.toFixed(2)}ms</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportData.rawOutput && (
        <div className="mt-6">
          <h3 className="text-md font-bold mb-2 flex items-center">
            Detalles Técnicos (Log Crudo)
            <button 
                onClick={() => setIsTranslated(!isTranslated)}
                className="ml-4 p-1 rounded bg-slate-700 text-white hover:bg-slate-600"
                title={isTranslated ? "Ver en Inglés" : "Ver en Español"}
            >
                <Globe className="w-3 h-3" />
            </button>
          </h3>
          <pre className={`p-4 rounded-xl text-[10px] overflow-auto h-64 font-mono ${t('bg-slate-950 text-emerald-400', 'bg-slate-900 text-emerald-400')}`}>
            {isTranslated ? translateLog(reportData.rawOutput) : reportData.rawOutput}
          </pre>
        </div>
      )}
    </div>
  );
};

