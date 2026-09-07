
'use client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';

export const DistributionHistogram = ({ data }: { data: any[] }) => {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-64 w-full bg-slate-100 dark:bg-slate-900/50 animate-pulse rounded-2xl" />;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="label" stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
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
        <Bar dataKey="count" fill="#38bdf8">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#38bdf8' : '#818cf8'} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
