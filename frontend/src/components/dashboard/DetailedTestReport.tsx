import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, TrendingDown, Info, Settings, BarChart, ListOrdered, Download, Globe } from "lucide-react";
import { generateEndpointPDF } from './pdfHelpers';
import { useTheme } from "@/lib/theme-context";
import { translateLog } from '@/lib/log-translator';

interface DetailedTestReportProps {
  reportData: {
    tool: string;
    description: string;
    endpoint: string;
    method: string;
    users: number;
    rampUp: number;
    duration: number;
    logs: string; // Logs pasados
    metrics: {
      avgLatency: number;
      p95: number;
      p99: number;
      rps: number;
      totalRequests: number;
      successRate: number;
      errorRate: number;
      httpCodes: { [key: string]: number };
    };
  };
}

export const DetailedTestReport = ({ reportData }: DetailedTestReportProps) => {
  const { metrics } = reportData;
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;
  const [isTranslated, setIsTranslated] = useState(false);
  
  const downloadPDF = () => {
    generateEndpointPDF(reportData);
  };

  const getStatusInfo = () => {
    if (metrics.errorRate > 10) return { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertTriangle, text: "Crítico", message: "Alta tasa de fallos detectada. Revisar logs inmediatamente." };
    if (metrics.avgLatency > 1000) return { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: TrendingDown, text: "Degradado", message: "Latencia muy alta. El sistema no pudo gestionar la carga." };
    return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle, text: "Saludable", message: "El sistema respondió de manera óptima bajo la carga configurada." };
  };

  const status = getStatusInfo();
  
  return (
    <div className={`rounded-3xl p-8 shadow-sm mt-8 transition-all hover:shadow-md border ${t('bg-slate-900 border-slate-800', 'bg-white border-slate-200')}`}>
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-2xl font-bold flex items-center gap-3 ${t('text-white', 'text-slate-900')}`}>
            <ListOrdered className="text-sky-500 shrink-0" />
            <span className="break-all">{reportData.endpoint}</span>
        </h2>
        <div className="flex items-center gap-3">
            <button onClick={downloadPDF} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-xl transition flex items-center gap-2">
                <Download className="w-4 h-4" /> PDF
            </button>
            <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-semibold ${status.bg} ${status.color}`}>
                <status.icon className="w-5 h-5" />
                {status.text}
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${t('text-slate-400', 'text-slate-500')}`}>
            <Settings className="w-4 h-4" /> Configuración
          </h3>
          <div className={`p-5 rounded-2xl border space-y-3 ${t('bg-slate-950 border-slate-800', 'bg-slate-50 border-slate-100')}`}>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Herramienta</span><span className="font-semibold">{reportData.tool}</span></div>
            <div className="flex flex-col gap-1">
              <span className={`text-xs uppercase ${t('text-slate-400', 'text-slate-500')}`}>Endpoint</span>
              <span className="font-mono text-sm text-sky-600 dark:text-sky-400 break-all w-full text-right">{reportData.endpoint}</span>
            </div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Método</span><span className="font-bold">{reportData.method}</span></div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Usuarios</span><span>{reportData.users}</span></div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Tiempo</span><span>{reportData.duration}s</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${t('text-slate-400', 'text-slate-500')}`}>
            <BarChart className="w-4 h-4" /> Métricas Clave
          </h3>
          <div className={`p-5 rounded-2xl border space-y-3 ${t('bg-slate-950 border-slate-800', 'bg-slate-50 border-slate-100')}`}>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Latencia Prom.</span><span className="font-semibold">{metrics.avgLatency}ms</span></div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>P95 Latencia</span><span className="font-semibold">{metrics.p95}ms</span></div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>P99 Latencia</span><span className="font-semibold">{metrics.p99}ms</span></div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Throughput</span><span>{metrics.rps} req/s</span></div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Total Req.</span><span>{metrics.totalRequests}</span></div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Tasa Éxito</span><span className="text-emerald-500 font-bold">{metrics.successRate}%</span></div>
            <div className="flex justify-between"><span className={t('text-slate-400', 'text-slate-500')}>Tasa Fallos</span><span className="text-red-500 font-bold">{metrics.errorRate}%</span></div>
            <div className={`flex justify-between border-t pt-3 ${t('border-slate-800', 'border-slate-200')}`}>
                <span className={t('text-slate-400', 'text-slate-500')}>Códigos HTTP</span>
                <div className="flex gap-2">
                    {Object.entries(metrics.httpCodes).map(([code, count]) => (
                        <span key={code} className={`text-xs font-mono px-2 py-1 rounded ${t('bg-slate-800', 'bg-slate-200')}`}>
                            {code}: {count}
                        </span>
                    ))}
                </div>
            </div>
          </div>
          
          <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 mt-6 ${t('text-slate-400', 'text-slate-500')}`}>
            <BarChart className="w-4 h-4" /> Análisis de Distribución (Percentiles)
          </h3>
          <table className={`w-full text-xs text-left ${t('text-slate-400', 'text-slate-600')}`}>
            <thead className="uppercase text-slate-500">
                <tr>
                    <th className="px-2 py-2">Percentil</th>
                    <th className="px-2 py-2">Tiempo</th>
                    <th className="px-2 py-2">Interpretación</th>
                </tr>
            </thead>
            <tbody>
                <tr><td className="px-2 py-2 font-semibold">50% (Mediana)</td><td className="px-2 py-2">0.107s</td><td className="px-2 py-2">La mitad de los usuarios experimentó esto o menos.</td></tr>
                <tr><td className="px-2 py-2 font-semibold">90%</td><td className="px-2 py-2">0.144s</td><td className="px-2 py-2">El 90% de las peticiones fueron así de rápidas.</td></tr>
                <tr><td className="px-2 py-2 font-semibold">95%</td><td className="px-2 py-2">0.159s</td><td className="px-2 py-2">Rendimiento típico bajo carga alta.</td></tr>
                <tr><td className="px-2 py-2 font-semibold">99%</td><td className="px-2 py-2">0.212s</td><td className="px-2 py-2">Casos excepcionales (muy rápidos aún).</td></tr>
                <tr><td className="px-2 py-2 font-semibold">100% (Máximo)</td><td className="px-2 py-2">1.126s</td><td className="px-2 py-2">Tiempo máximo registrado en un caso aislado.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8">
        <h4 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center ${t('text-slate-400', 'text-slate-500')}`}>
            Logs Crudos (Resumen)
            <button 
                onClick={() => setIsTranslated(!isTranslated)}
                className="ml-4 p-1 rounded bg-slate-700 text-white hover:bg-slate-600"
                title={isTranslated ? "Ver en Inglés" : "Ver en Español"}
            >
                <Globe className="w-3 h-3" />
            </button>
        </h4>
        <pre className={`p-4 rounded-xl text-xs overflow-x-auto h-96 ${t('bg-black text-emerald-400', 'bg-slate-950 text-emerald-400')}`}>
            {isTranslated ? translateLog(reportData.logs) : reportData.logs}
        </pre>
      </div>
    </div>
  );
};
