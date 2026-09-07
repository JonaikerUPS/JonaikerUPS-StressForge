"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { type LucideIcon, ChevronRight, CheckCircle2, Clock } from "lucide-react";

interface ModuleCardProps {
  href: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  color: string;
  completed: boolean;
  primaryStat?: string;
  secondaryStat?: string;
  emptyHint?: string;
}

const getPalette = (isDarkMode: boolean) => ({
  sky:     { bg: "bg-sky-500/12",     iconColor: "text-sky-500",     border: isDarkMode ? "hover:border-sky-500/30" : "hover:border-sky-400/50", glow: "from-sky-500/10", text: isDarkMode ? "text-sky-400" : "text-sky-600", glowHex: "#0ea5e9", completedBg: "bg-sky-500/5",     completedBorder: isDarkMode ? "border-sky-500/20" : "border-sky-400/30" },
  emerald: { bg: "bg-emerald-500/12", iconColor: "text-emerald-500", border: isDarkMode ? "hover:border-emerald-500/30" : "hover:border-emerald-400/50", glow: "from-emerald-500/10", text: isDarkMode ? "text-emerald-400" : "text-emerald-600", glowHex: "#10b981", completedBg: "bg-emerald-500/5", completedBorder: isDarkMode ? "border-emerald-500/20" : "border-emerald-400/30" },
  amber:   { bg: "bg-amber-500/12",   iconColor: "text-amber-500",   border: isDarkMode ? "hover:border-amber-500/30" : "hover:border-amber-400/50",   glow: "from-amber-500/10",   text: isDarkMode ? "text-amber-400" : "text-amber-600",   glowHex: "#f59e0b", completedBg: "bg-amber-500/5",   completedBorder: isDarkMode ? "border-amber-500/20" : "border-amber-400/30"   },
  purple:  { bg: "bg-purple-500/12",  iconColor: "text-purple-500",  border: isDarkMode ? "hover:border-purple-500/30" : "hover:border-purple-400/50",  glow: "from-purple-500/10",  text: isDarkMode ? "text-purple-400" : "text-purple-600",  glowHex: "#8b5cf6", completedBg: "bg-purple-500/5",  completedBorder: isDarkMode ? "border-purple-500/20" : "border-purple-400/30"  },
  cyan:    { bg: "bg-cyan-500/12",    iconColor: "text-cyan-500",    border: isDarkMode ? "hover:border-cyan-500/30" : "hover:border-cyan-400/50",    glow: "from-cyan-500/10",    text: isDarkMode ? "text-cyan-400" : "text-cyan-600",    glowHex: "#06b6d4", completedBg: "bg-cyan-500/5",    completedBorder: isDarkMode ? "border-cyan-500/20" : "border-cyan-400/30"    },
  rose:    { bg: "bg-rose-500/12",    iconColor: "text-rose-500",    border: isDarkMode ? "hover:border-rose-500/30" : "hover:border-rose-400/50",    glow: "from-rose-500/10",    text: isDarkMode ? "text-rose-400" : "text-rose-600",    glowHex: "#f43f5e", completedBg: "bg-rose-500/5",    completedBorder: isDarkMode ? "border-rose-500/20" : "border-rose-400/30"    },
  pink:    { bg: "bg-pink-500/12",    iconColor: "text-pink-500",    border: isDarkMode ? "hover:border-pink-500/30" : "hover:border-pink-400/50",    glow: "from-pink-500/10",    text: isDarkMode ? "text-pink-400" : "text-pink-600",    glowHex: "#ec4899", completedBg: "bg-pink-500/5",    completedBorder: isDarkMode ? "border-pink-500/20" : "border-pink-400/30"    },
});

export default function ModuleCard({
  href, label, sublabel, icon: Icon, color, completed,
  primaryStat, secondaryStat, emptyHint,
}: ModuleCardProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;
  
  const palette = getPalette(isDarkMode);
  const p = (palette as any)[color] ?? palette.sky;

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${t('bg-slate-900/50 hover:bg-slate-900/80', 'bg-white/80 hover:bg-white/95')} ${completed
          ? `${p.completedBorder} ${p.completedBg}`
          : `border-slate-200/60 ${t('border-white/6', '')} ${p.border}`
        }`}
    >
      {/* Corner radial glow */}
      <div
        className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: p.glowHex, opacity: completed ? 0.08 : 0 }}
      />
      <div
        className={`absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-500 pointer-events-none ${completed ? "opacity-[0.07]" : "opacity-0 group-hover:opacity-[0.07]"}`}
        style={{ backgroundColor: p.glowHex }}
      />

      {/* Accent top bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300 ${completed ? "opacity-80" : "opacity-0 group-hover:opacity-60"}`}
        style={{ background: `linear-gradient(90deg, transparent, ${p.glowHex}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${p.bg} transition-transform group-hover:scale-105`}>
            <Icon className={`h-5 w-5 ${p.iconColor}`} />
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-tight ${t('text-white', 'text-slate-900')}`}>{label}</h3>
            <p className={`text-[10px] mt-0.5 ${t('text-slate-500', 'text-slate-400')}`}>{sublabel}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
          completed
            ? t("bg-emerald-900/30 text-emerald-400", "bg-emerald-500/10 text-emerald-600")
            : t("bg-white/5 text-slate-500", "bg-slate-100 text-slate-400")
        }`}>
          {completed
            ? <><CheckCircle2 className="h-2.5 w-2.5" />OK</>
            : <><Clock className="h-2.5 w-2.5" />Pendiente</>
          }
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 min-h-[40px]">
        {completed && primaryStat ? (
          <>
            <p className={`text-sm font-bold ${t('text-slate-100', 'text-slate-800')}`}>{primaryStat}</p>
            {secondaryStat && (
              <p className={`text-[11px] mt-0.5 line-clamp-1 ${t('text-slate-500', 'text-slate-400')}`}>{secondaryStat}</p>
            )}
          </>
        ) : (
          <p className={`text-[11px] leading-relaxed ${t('text-slate-500', 'text-slate-400')}`}>{emptyHint}</p>
        )}
      </div>

      {/* Footer */}
      <div className={`mt-4 flex items-center justify-between border-t pt-3 text-[10px] font-semibold transition-colors ${
        completed
          ? `border-slate-200/60 ${t('border-white/5', '')} ${p.text}`
          : `${t('border-white/4', 'border-slate-100')} ${t('text-slate-500', 'text-slate-400')} group-hover:` + p.text.split(" ")[0]
      }`}>
        <span className="group-hover:underline underline-offset-2">{completed ? "Ver resultados" : "Ir a la herramienta"}</span>
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
