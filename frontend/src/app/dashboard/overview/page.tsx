'use client';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Gauge, Database, TerminalSquare } from 'lucide-react';
import { getBackendUrl } from '@/lib/api-url';

const API_URL = getBackendUrl();

export default function GlobalDashboard() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/system/summary`)
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error(err));
  }, []);

  if (!summary) return <div className="p-8">Cargando dashboard...</div>;

  return (
    <div className="min-h-screen p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <h1 className="text-4xl font-extrabold mb-8">System Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Database size={32} /></div>
          <div>
            <p className="text-sm text-slate-500">Total Pruebas Ejecutadas</p>
            <p className="text-3xl font-bold">{summary.totalTests}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl"><Gauge size={32} /></div>
          <div>
            <p className="text-sm text-slate-500">Estado del Sistema</p>
            <p className="text-3xl font-bold text-green-600">{summary.status.toUpperCase()}</p>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mt-12 mb-6">Actividad Reciente</h2>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-4">Herramienta</th>
              <th className="p-4">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {summary.latestTests.map((test: any) => (
              <tr key={test._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="p-4 font-bold uppercase">{test.toolName}</td>
                <td className="p-4 text-slate-500">{new Date(test.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
