"use client";
import { useState } from "react";
import { Play, Settings, Clock, Users, Zap, Globe, Pencil, Trash2, ZoomIn, ZoomOut, Check } from "lucide-react";
import { motion } from "framer-motion";

export const TestControlPanel = ({ customConfig }: { customConfig?: any }) => {
  const [isCustomYaml, setIsCustomYaml] = useState(false);
  const [customYaml, setCustomYaml] = useState("");
  const [isEditingYaml, setIsEditingYaml] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(160);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    targetUrl: "https://httpbin.org/get",
    concurrency: 10,
    durationMs: 10000,
    rampUp: 1,
  });

  const t = (darkClass: string, _lightClass: string) => darkClass;

  const runTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <motion.div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-sky-500" />
        <h2 className={`text-lg font-semibold ${t('text-white', 'text-slate-900')}`}>Configurar Escenario</h2>
        <button onClick={() => setIsCustomYaml(!isCustomYaml)} className={`ml-auto p-2 rounded-lg ${isCustomYaml ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-slate-800 text-slate-500'}`}>
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      {isCustomYaml && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <label className={`text-sm font-medium ${t('text-slate-400', 'text-slate-500')}`}>YAML Personalizado</label>
            <div className="flex gap-1">
              <button onClick={() => setIsEditingYaml(!isEditingYaml)} className="p-1 rounded hover:bg-slate-700">
                {isEditingYaml ? <Check className="h-4 w-4 text-emerald-400" /> : <Pencil className="h-4 w-4 text-sky-400" />}
              </button>
              <button onClick={() => setTextareaHeight(Math.min(textareaHeight + 40, 400))} className="p-1 rounded hover:bg-slate-700">
                <ZoomIn className="h-4 w-4 text-slate-400" />
              </button>
              <button onClick={() => setTextareaHeight(Math.max(textareaHeight - 40, 80))} className="p-1 rounded hover:bg-slate-700">
                <ZoomOut className="h-4 w-4 text-slate-400" />
              </button>
              <button onClick={() => setCustomYaml("")} className="p-1 rounded hover:bg-slate-700">
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>
          <textarea
            value={customYaml}
            readOnly={!isEditingYaml}
            onChange={(e) => setCustomYaml(e.target.value)}
            className={`w-full rounded-xl border p-3 font-mono text-xs ${t('bg-slate-950 border-slate-700 text-slate-200', 'bg-slate-50 border-slate-200 text-slate-800')}`}
            style={{ height: `${textareaHeight}px` }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {!customConfig && (
          <div className="md:col-span-4 space-y-2">
            <label className={`text-sm font-medium flex items-center gap-2 ${t('text-slate-400', 'text-slate-500')}`}>
              <Globe className="h-4 w-4" /> URL del Endpoint
            </label>
            <input type="text" value={config.targetUrl} onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })} className={`w-full rounded-xl border p-2.5 outline-none ${t('bg-slate-800 border-slate-700 text-white', 'bg-slate-50 border-slate-200')}`} />
          </div>
        )}

        <div className="space-y-2">
          <label className={`text-sm font-medium flex items-center gap-2 ${t('text-slate-400', 'text-slate-500')}`}>
            <Users className="h-4 w-4" /> Usuarios
          </label>
          <input type="number" value={customConfig?.concurrency || config.concurrency} onChange={(e) => !customConfig && setConfig({ ...config, concurrency: Number(e.target.value) })} className={`w-full rounded-xl border p-2.5 outline-none ${t('bg-slate-800 border-slate-700 text-white', 'bg-slate-50 border-slate-200')}`} />
        </div>
        <div className="space-y-2">
          <label className={`text-sm font-medium flex items-center gap-2 ${t('text-slate-400', 'text-slate-500')}`}>
            <Clock className="h-4 w-4" /> Duración (ms)
          </label>
          <input type="number" value={customConfig?.durationMs || config.durationMs} onChange={(e) => !customConfig && setConfig({ ...config, durationMs: Number(e.target.value) })} className={`w-full rounded-xl border p-2.5 outline-none ${t('bg-slate-800 border-slate-700 text-white', 'bg-slate-50 border-slate-200')}`} />
        </div>
        <div className="space-y-2">
          <label className={`text-sm font-medium flex items-center gap-2 ${t('text-slate-400', 'text-slate-500')}`}>
            <Zap className="h-4 w-4" /> Ramp-up (s)
          </label>
          <input type="number" value={customConfig?.rampUp || config.rampUp} onChange={(e) => !customConfig && setConfig({ ...config, rampUp: Number(e.target.value) })} className={`w-full rounded-xl border p-2.5 outline-none ${t('bg-slate-800 border-slate-700 text-white', 'bg-slate-50 border-slate-200')}`} />
        </div>
        <div className="flex items-end">
          <button
            onClick={runTest}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-white font-semibold transition hover:bg-sky-600 disabled:opacity-50"
          >
            <Play className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? "Ejecutando..." : "Iniciar"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
