"use client";

import { useUnifiedTest } from "@/lib/unified-test-context";
import { Cpu, Loader2, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { checkToolStatus } from "@/lib/api-client";

// Mapeo dinámico de temas, gradientes y resplandores por herramienta
const toolThemes: Record<
  string,
  {
    badgeBg: string;
    text: string;
    border: string;
    glow: string;
    accent: string;
    gradient: string;
  }
> = {
  k6: {
    badgeBg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/30",
    glow: "hover:shadow-purple-500/20 hover:border-purple-500/50",
    accent: "bg-purple-500",
    gradient: "from-purple-500/15 via-transparent to-transparent",
  },
  artillery: {
    badgeBg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/30",
    glow: "hover:shadow-rose-500/20 hover:border-rose-500/50",
    accent: "bg-rose-500",
    gradient: "from-rose-500/15 via-transparent to-transparent",
  },
  autocannon: {
    badgeBg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/30",
    glow: "hover:shadow-orange-500/20 hover:border-orange-500/50",
    accent: "bg-orange-500",
    gradient: "from-orange-500/15 via-transparent to-transparent",
  },
  jmeter: {
    badgeBg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    glow: "hover:shadow-amber-500/20 hover:border-amber-500/50",
    accent: "bg-amber-500",
    gradient: "from-amber-500/15 via-transparent to-transparent",
  },
  locust: {
    badgeBg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
    glow: "hover:shadow-emerald-500/20 hover:border-emerald-500/50",
    accent: "bg-emerald-500",
    gradient: "from-emerald-500/15 via-transparent to-transparent",
  },
  taurus: {
    badgeBg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/30",
    glow: "hover:shadow-cyan-500/20 hover:border-cyan-500/50",
    accent: "bg-cyan-500",
    gradient: "from-cyan-500/15 via-transparent to-transparent",
  },
  hey: {
    badgeBg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/30",
    glow: "hover:shadow-teal-500/20 hover:border-teal-500/50",
    accent: "bg-teal-500",
    gradient: "from-teal-500/15 via-transparent to-transparent",
  },
  bombardier: {
    badgeBg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
    glow: "hover:shadow-indigo-500/20 hover:border-indigo-500/50",
    accent: "bg-indigo-500",
    gradient: "from-indigo-500/15 via-transparent to-transparent",
  },
  vegeta: {
    badgeBg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
    glow: "hover:shadow-red-500/20 hover:border-red-500/50",
    accent: "bg-red-500",
    gradient: "from-red-500/15 via-transparent to-transparent",
  },
  gatling: {
    badgeBg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/30",
    glow: "hover:shadow-orange-500/20 hover:border-orange-500/50",
    accent: "bg-orange-500",
    gradient: "from-orange-500/15 via-transparent to-transparent",
  },
  simulacion: {
    badgeBg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/30",
    glow: "hover:shadow-slate-500/20 hover:border-slate-500/50",
    accent: "bg-slate-500",
    gradient: "from-slate-500/15 via-transparent to-transparent",
  },
  all: {
    badgeBg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/30",
    glow: "hover:shadow-sky-500/20 hover:border-sky-500/50",
    accent: "bg-sky-500",
    gradient: "from-sky-500/15 via-transparent to-transparent",
  },
};

const toolLabels: Record<string, string> = {
  k6: "k6 Engine",
  artillery: "Artillery",
  autocannon: "Autocannon",
  jmeter: "JMeter Suite",
  locust: "Locust",
  taurus: "Taurus",
  hey: "Hey",
  bombardier: "Bombardier",
  vegeta: "Vegeta",
  gatling: "Gatling",
  simulacion: "Simulación Nativa",
  all: "Consolidado Global",
};

export const ToolIndicator = () => {
  const { selectedTool } = useUnifiedTest();
  const [isUp, setIsUp] = useState<boolean | null>(null);

  useEffect(() => {
    checkToolStatus()
      .then((data) => {
        const toolKey = selectedTool.toLowerCase();
        setIsUp(!!data.tools[toolKey]);
      })
      .catch((err) => {
        console.warn("ToolIndicator - status check failed:", err.message);
        setIsUp(false);
      });
  }, [selectedTool]);

  const theme = toolThemes[selectedTool] || toolThemes.simulacion;

  return (
    <div
      className={`group relative inline-flex items-center overflow-hidden rounded-2xl  border-slate-200/90 bg-white/80 p-1.5 pr-3.5 shadow-md backdrop-blur-2xl transition-all duration-300 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-950/80 ${theme.glow}`}
    >
      {/* Sutil resplandor dinámico de fondo */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} opacity-30 transition-opacity duration-500 group-hover:opacity-60 pointer-events-none`}
      />

      {/* Contenedor de Icono tipo Micro-HUD */}
      <div
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl  transition-all duration-300 ${theme.badgeBg} ${theme.border} ${theme.text}`}
      >
        <Cpu className="h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${theme.accent} ring-2 ring-white dark:ring-slate-950`}
        />
      </div>

      {/* Nombre e información del motor */}
      <div className="ml-3 flex flex-col text-left">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Engine Active
        </span>
        <span className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {toolLabels[selectedTool] || "Desconocido"}
        </span>
      </div>

      {/* Separador vertical fino */}
      <div className="mx-3 h-5 w-[1px] bg-slate-200/80 dark:bg-slate-800/80" />

      {/* Badge Telemetría de Estado */}
      <div className="flex items-center">
        {isUp === null && (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
            <span className="tracking-wider">CHECKING</span>
          </div>
        )}

        {isUp === true && (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="tracking-wider">ONLINE</span>
          </div>
        )}

        {isUp === false && (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400">
            <Activity className="h-3 w-3 text-rose-500 animate-pulse" />
            <span className="tracking-wider">OFFLINE</span>
          </div>
        )}
      </div>
    </div>
  );
};