
'use client';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';

export const PercentilesChart = ({ data }: { data: any[] }) => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-64 w-full bg-slate-100 dark:bg-slate-900/50 animate-pulse rounded-2xl" />;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
        <XAxis dataKey="time" hide />
        <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
        <Tooltip
          contentStyle={{
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
            color: isDarkMode ? '#f8fafc' : '#0f172a',
            borderRadius: '1rem',
            border: isDarkMode ? '1px solid #1e293b' : '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="p90" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};
