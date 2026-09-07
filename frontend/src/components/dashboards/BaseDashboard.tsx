
import React from 'react';

interface BaseDashboardProps {
  children: React.ReactNode;
  title: string;
}

export const BaseDashboard = ({ children, title }: BaseDashboardProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 px-6">{title}</h2>
      {children}
    </div>
  );
};
