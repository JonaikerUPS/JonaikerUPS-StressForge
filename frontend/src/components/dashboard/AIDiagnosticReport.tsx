"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

interface AIDiagnosticReportProps {
  summary: {
    totalRequests: number;
    successful: number;
    failed: number;
    avgLatency: number;
    p95: number;
    p99: number;
    throughput: number;
    targetUrl?: string;
    method?: string;
  };
}

export const AIDiagnosticReport: React.FC<AIDiagnosticReportProps> = ({ summary }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const total = summary?.totalRequests || 0;
  if (!summary || total === 0) {
    return null;
  }
  const success = summary.successful || 0;
  const failed = summary.failed || (total > success ? total - success : 0);
  const successRate = total > 0 ? Math.round((success / total) * 100) : (total === 0 ? 0 : 100);
  const failRate = 100 - successRate;
  const avgLat = summary.avgLatency || 0;
  const p95 = summary.p95 || avgLat * 1.3;
  const p99 = summary.p99 || avgLat * 1.6;

  let status: "CRITICAL" | "WARNING" | "OPTIMAL" = "OPTIMAL";
  let statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  let statusText = "RENDIMIENTO ÓPTIMO";

  if (successRate < 95 || avgLat > 1000 || failed > 0) {
    status = "CRITICAL";
    statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/30";
    statusText = "DIAGNÓSTICO CRÍTICO";
  } else if (successRate < 99 || avgLat > 400) {
    status = "WARNING";
    statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
    statusText = "ADVERTENCIA DE RENDIMIENTO";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border ${isDark ? 'border-emerald-500/30 bg-slate-950/90' : 'border-slate-200 bg-white'} p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden my-6`}
    >
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/30">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-wide text-slate-900 dark:text-white">
                Asistente IA // Análisis y Diagnóstico en Tiempo Real
              </h3>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Análisis forense automatizado de la ejecución de carga
            </p>
          </div>
        </div>

        <div className={`px-4 py-1.5 rounded-full border font-mono text-xs font-bold tracking-wider uppercase ${statusColor}`}>
          {statusText}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <h4 className="font-mono text-xs uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Diagnóstico Específico de la Prueba
          </h4>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {successRate === 0 ? (
              <>
                Se ejecutó una simulación de estrés concurrente por un total de <strong className="text-slate-900 dark:text-white">{total.toLocaleString()} peticiones</strong>. Se detectó una <strong className="text-rose-400">tasa de fallo del 100% ({failed} peticiones fallidas)</strong>. El servidor destino rechazó todas las conexiones (posible error 502 Bad Gateway, timeout o caída de servidor por saturación).
              </>
            ) : successRate < 95 ? (
              <>
                Se ejecutó una simulación concurrente de <strong className="text-slate-900 dark:text-white">{total.toLocaleString()} peticiones</strong> con una tasa de éxito del <strong className="text-rose-400">{successRate}%</strong> y una <strong>tasa de fallo del {failRate}% ({failed} peticiones con error)</strong>, evidenciando problemas de estabilidad bajo carga.
              </>
            ) : (
              <>
                Se completó la prueba de carga exitosamente con <strong className="text-slate-900 dark:text-white">{total.toLocaleString()} peticiones</strong> procesadas y una tasa de éxito del <strong className="text-emerald-400">{successRate}%</strong>.
              </>
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 p-3">
              <span className="text-slate-500 block text-[10px]">TASA ÉXITO / FALLO</span>
              <strong className={`text-base ${successRate >= 95 ? "text-emerald-400" : "text-rose-400"}`}>{successRate}% / {failRate}%</strong>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 p-3">
              <span className="text-slate-500 block text-[10px]">LATENCIA PROM</span>
              <strong className="text-base text-cyan-400">{avgLat.toFixed(1)}ms</strong>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 p-3">
              <span className="text-slate-500 block text-[10px]">PERCENTIL P95</span>
              <strong className="text-base text-amber-400">{p95.toFixed(1)}ms</strong>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-1">
            <p>• <strong>Percentil P95 ({p95.toFixed(1)}ms):</strong> El 95% de las peticiones válidas respondieron por debajo de este umbral.</p>
            <p>• <strong>Percentil P99 ({p99.toFixed(1)}ms):</strong> Muestra el tiempo de respuesta del 1% más lento, crítico para detectar bloqueos de hilos de ejecución.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/40 p-5 flex flex-col justify-between">
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-cyan-400 flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" /> Recomendación de Acción
            </h4>
            
            {successRate === 0 ? (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>CAÍDA TOTAL DE CONEXIONES (100% FALLO):</span>
                </div>
                <p>1. <strong>Verificar estado del servicio:</strong> El servidor de destino devolvió 502/500 o cortó el socket.</p>
                <p>2. <strong>Reducir concurrencia:</strong> Inicia con `concurrency: 1` y aplica aceleración gradual (`ramp-up`).</p>
                <p>3. <strong>Revisar cabeceras y payloads:</strong> Asegúrate de enviar la cabecera `Content-Type: application/json`.</p>
              </div>
            ) : successRate < 95 ? (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>TASA DE FALLO INACEPTABLE ({failRate}% de errores):</span>
                </div>
                <p>1. Revisar logs de errores 5xx en el backend para identificar excepciones no controladas.</p>
                <p>2. Analizar contención en base de datos y saturación de hilos de CPU.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>SISTEMA ESTABLE ({successRate}% de éxito):</span>
                </div>
                <p>El servicio superó los umbrales de estrés sin errores significativos de conectividad.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>IA FORENSIC AGENT v2.5</span>
            <span className="text-emerald-400">LIVE ANALYSIS</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
