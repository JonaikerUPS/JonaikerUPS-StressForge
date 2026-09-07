import React from 'react';
import { Download, FileSpreadsheet, Loader2, BarChart3, Zap, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTheme } from "@/lib/theme-context";

interface DashboardHeaderProps {
  status: string;
  statusColor: string;
  statusMessage: string;
  exporting: "csv" | "pdf" | "report" | null;
  exportCSV: () => void;
  exportPDF: () => void;
  exportReportPDF: () => void;
}

const getStatusMeta = (isDarkMode: boolean) => ({
  Operacional: {
    dot: 'bg-emerald-400',
    ping: 'bg-emerald-400',
    badge: isDarkMode 
      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20' 
      : 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100',
    glow: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
    icon: ShieldCheck,
  },
  Degradado: {
    dot: 'bg-amber-400',
    ping: 'bg-amber-400',
    badge: isDarkMode 
      ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 shadow-amber-950/20' 
      : 'bg-amber-50 border-amber-200 text-amber-700 shadow-amber-100',
    glow: 'from-amber-500/30 via-amber-500/10 to-transparent',
    icon: AlertTriangle,
  },
  'Error crítico': {
    dot: 'bg-rose-500',
    ping: 'bg-rose-500',
    badge: isDarkMode 
      ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 shadow-rose-950/20' 
      : 'bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100',
    glow: 'from-rose-500/30 via-rose-500/10 to-transparent',
    icon: AlertCircle,
  },
});

interface ExportButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  icon: React.ElementType;
  label: string;
  isDarkMode: boolean;
  accent: 'emerald' | 'sky' | 'indigo';
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onClick, disabled, loading, icon: Icon, label, isDarkMode, accent
}) => {
  const accentStyles = {
    emerald: isDarkMode 
      ? 'hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300 hover:shadow-emerald-500/10' 
      : 'hover:border-emerald-300 hover:bg-emerald-50/80 hover:text-emerald-700 hover:shadow-emerald-500/10',
    sky: isDarkMode 
      ? 'hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-300 hover:shadow-sky-500/10' 
      : 'hover:border-sky-300 hover:bg-sky-50/80 hover:text-sky-700 hover:shadow-sky-500/10',
    indigo: isDarkMode 
      ? 'hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300 hover:shadow-indigo-500/10' 
      : 'hover:border-indigo-300 hover:bg-indigo-50/80 hover:text-indigo-700 hover:shadow-indigo-500/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold tracking-wide backdrop-blur-md transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-40 ${
        isDarkMode
          ? "border-slate-800/80 bg-slate-900/60 text-slate-300 shadow-inner shadow-white/5"
          : "border-slate-200/90 bg-white/80 text-slate-700 shadow-sm shadow-slate-200/50"
      } ${accentStyles[accent]}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin opacity-80" />
      ) : (
        <Icon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
      )}
      <span className="hidden sm:inline-block font-mono uppercase text-[11px] tracking-wider">{label}</span>
    </button>
  );
};

const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  status, statusMessage, exporting, exportCSV, exportPDF, exportReportPDF
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  const statusMeta = getStatusMeta(isDarkMode);
  const meta = statusMeta[status as keyof typeof statusMeta] ?? statusMeta['Operacional'];

  return (
    <header className={`relative overflow-hidden rounded-3xl border transition-all duration-300 ${
      t(
        'border-slate-800/80 bg-slate-950/70 shadow-2xl shadow-black/50 backdrop-blur-2xl',
        'border-slate-200/80 bg-white/70 shadow-xl shadow-slate-200/40 backdrop-blur-2xl'
      )
    }`}>
      {/* Top Accent Light Beam */}
      <div className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${meta.glow}`} />

      {/* Background Radial Glow */}
      <div className={`pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-20 ${
        isDarkMode ? 'bg-sky-500' : 'bg-sky-300'
      }`} />

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Brand & Status */}
        <div className="flex items-start gap-4">
          <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 hover:scale-105 ${
            t('border-sky-500/30 bg-gradient-to-b from-sky-500/20 to-indigo-600/10 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/20',
              'border-sky-200 bg-gradient-to-b from-sky-50 to-indigo-50/50 shadow-md shadow-sky-100 ring-1 ring-sky-300/30')
          }`}>
            <BarChart3 className="h-6 w-6 text-sky-400" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className={`text-xl font-extrabold tracking-tight sm:text-2xl ${t('text-white', 'text-slate-900')}`}>
                StressForge
              </h1>

              {/* High-tech Status Pill */}
              <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 shadow-sm transition-all duration-300 ${meta.badge}`}>
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${meta.ping}`} />
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${meta.dot}`} />
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{status}</span>
              </div>
            </div>

            <p className={`text-xs font-medium tracking-wide ${t('text-slate-400', 'text-slate-500')}`}>
              {statusMessage || 'Panel de rendimiento, pruebas de carga y diagnósticos'}
            </p>
          </div>
        </div>

        {/* Action Glass Toolbar */}
        <div className={`flex shrink-0 items-center gap-2 rounded-2xl border p-1.5 backdrop-blur-md ${
          t('border-slate-800/60 bg-slate-900/40', 'border-slate-200/60 bg-slate-100/50')
        }`}>
          <ExportButton
            onClick={exportCSV}
            disabled={exporting === "csv"}
            loading={exporting === "csv"}
            icon={FileSpreadsheet}
            label="CSV"
            isDarkMode={isDarkMode}
            accent="emerald"
          />

          <ExportButton
            onClick={exportPDF}
            disabled={exporting === "pdf"}
            loading={exporting === "pdf"}
            icon={Download}
            label="PDF Dashboard"
            isDarkMode={isDarkMode}
            accent="sky"
          />

          <ExportButton
            onClick={exportReportPDF}
            disabled={exporting === "report"}
            loading={exporting === "report"}
            icon={Zap}
            label="Reporte PDF"
            isDarkMode={isDarkMode}
            accent="indigo"
          />
        </div>

      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;