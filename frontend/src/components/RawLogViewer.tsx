"use client";

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { translateLog } from '../lib/log-translator';
import { getBackendUrl } from '../lib/api-url';

const BACKEND_URL = getBackendUrl();

export function RawLogViewer() {
  const [logs, setLogs] = useState<Record<string, string>>({});
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tests/results`);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Error fetching logs", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-md bg-slate-900 text-green-400">
      <h2 className="text-xl font-bold mb-4">Visor de Logs Crudos</h2>
      <select 
        onChange={(e) => setSelectedTool(e.target.value)} 
        value={selectedTool}
        className="mb-4 p-2 bg-slate-800 border border-slate-700 rounded w-full"
      >
        <option value="">Selecciona una herramienta...</option>
        {Object.keys(logs).map(tool => (
          <option key={tool} value={tool}>{tool}</option>
        ))}
      </select>

      <div className="flex gap-2 mb-4">
        <button onClick={fetchLogs} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? "Actualizando..." : "Actualizar Logs"}
        </button>
        <button 
            onClick={() => setIsTranslated(!isTranslated)}
            className={`p-2 rounded ${isTranslated ? 'bg-emerald-600' : 'bg-slate-600'} text-white`}
            title={isTranslated ? "Ver en Inglés" : "Ver en Español"}
        >
          <Globe className="w-4 h-4" />
        </button>
      </div>

      {selectedTool && (
        <pre className="p-4 bg-black overflow-auto h-[400px] text-xs font-mono">
          {isTranslated ? translateLog(logs[selectedTool]) : logs[selectedTool]}
        </pre>
      )}
    </div>
  );
}
