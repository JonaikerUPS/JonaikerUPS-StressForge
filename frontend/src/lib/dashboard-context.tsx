
import { createContext, useContext, useState } from 'react';
// Removed unused import

export type HealthStatus = 'success' | 'warning' | 'critical';

interface DashboardContextType {
  health: HealthStatus;
  setHealth: (h: HealthStatus) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [health, setHealth] = useState<HealthStatus>('success');

  return (
    <DashboardContext.Provider value={{ health, setHealth }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
};
