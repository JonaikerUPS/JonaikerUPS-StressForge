"use client";

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from "@/lib/theme-context";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  desc: string;
  trend?: number; // positive = up, negative = down, undefined = no trend
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, color, desc, trend }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${t('border-white/15 bg-slate-900/50 hover:border-white/15 hover:bg-slate-900/70', 'border-slate-200/60 bg-white/80 hover:border-slate-300/60 hover:bg-white/95')}`}
    >
      {/* Corner gradient glow */}
      <div
        className="absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: color }}
      />

      {/* Top accent gradient line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${t('text-slate-500', 'text-slate-400')}`}>
            {label}
          </p>
          <p className={`mt-2.5 text-2xl font-bold tracking-tight truncate ${t('text-white', 'text-slate-900')}`}>
            {value}
          </p>
          <p className={`mt-1 text-[11px] truncate ${t('text-slate-500', 'text-slate-400')}`}>{desc}</p>
        </div>

        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="relative mt-3 flex items-center gap-1.5 text-[11px] font-semibold">
          {trend > 0 ? (
            <><TrendingUp className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">+{trend}%</span></>
          ) : trend < 0 ? (
            <><TrendingDown className="h-3 w-3 text-rose-500" /><span className="text-rose-500">{trend}%</span></>
          ) : (
            <><Minus className="h-3 w-3 text-slate-400" /><span className="text-slate-400">Sin cambio</span></>
          )}
          <span className={t('text-slate-500', 'text-slate-400')}>vs. último test</span>
        </div>
      )}
    </article>
  );
};

export default MetricCard;
