export declare const startMonitoring: () => void;
export declare const getLatestSample: () => {
    cpuUsage: number;
    usedRamGB: number;
    totalRamGB: number;
};
export declare const stopMonitoring: () => {
    avgCpu: number;
    maxCpu: number;
    avgRam: number;
    maxRam: number;
};
//# sourceMappingURL=monitor.d.ts.map