"use client";

import { TOOL_SCHEMAS } from '@/lib/tool-schemas';
import { useTheme } from "@/lib/theme-context";

export const DynamicToolConfig = ({ tool, config, onChange }: { tool: string, config: any, onChange: (key: string, value: any) => void }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const t = (dark: string, light: string) => isDarkMode ? dark : light;

  const schema = TOOL_SCHEMAS[tool];
  if (!schema) return null;

  return (
    <div className={`p-4 rounded-2xl border ${t('bg-slate-900/50 border-slate-800', 'bg-white/50 border-slate-200')}`}>
      <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wider ${t('text-slate-400', 'text-slate-500')}`}>{schema.label} Configuration</h3>
      <div className="grid grid-cols-2 gap-4">
        {schema.parameters.map(p => (
            <div key={p.id} className={p.type === 'text' ? 'col-span-2' : ''}>
              <label className={`block text-xs font-medium mb-1 ${t('text-slate-300', 'text-slate-700')}`}>{p.label}</label>
              <p className={`text-[10px] mb-1.5 leading-tight ${t('text-slate-500', 'text-slate-500')}`}>{p.description}</p>
              {p.type === 'text' ? (
                <textarea
                  value={config[p.id] || ''}
                  onChange={(e) => onChange(p.id, e.target.value)}
                  className={`w-full rounded-lg p-2 text-sm border outline-none min-h-[80px] ${t('bg-slate-950 border-slate-800 text-slate-100', 'bg-white border-slate-200 text-slate-900')}`}
                />
              ) : (
                <input
                  type={p.type}
                  value={config[p.id] || ''}
                  onChange={(e) => onChange(p.id, e.target.value)}
                  className={`w-full rounded-lg p-2 text-sm border outline-none ${t('bg-slate-950 border-slate-800 text-slate-100', 'bg-white border-slate-200 text-slate-900')}`}
                />
              )}
            </div>
        ))}
      </div>
    </div>
  );
};
