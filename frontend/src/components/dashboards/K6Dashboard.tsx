
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { BaseDashboard } from './BaseDashboard';
import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { generateReportPdf } from '../../lib/pdf-generator';

export const K6Dashboard = ({ data }: { data: any[] }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="h-80 w-full animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl" />;

  return (
    <BaseDashboard title="k6 Load Test">
      <div className="flex justify-end p-4">
        <button 
          onClick={() => generateReportPdf('k6', data)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={18} />
          Descargar PDF
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div className="bg-white/80 border border-slate-200 shadow-sm backdrop-blur-xl p-6 rounded-2xl dark:bg-slate-900/50 dark:border-white/10">
          <h3 className="text-sm text-slate-500 dark:text-slate-400 font-medium">Virtual Users (VUs)</h3>
          <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            {data.length > 0 ? data[data.length - 1].vus : 0}
          </p>
        </div>

        <div className="bg-white/80 border border-slate-200 shadow-sm backdrop-blur-xl p-6 rounded-2xl dark:bg-slate-900/50 dark:border-white/10 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-stroke-slate-700" />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#64748b" className="dark:stroke-slate-400" />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }} />
              <Line 
                type="monotone" 
                dataKey="rps" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                isAnimationActive={true} 
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </BaseDashboard>
  );
};
