"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopMonitoring = exports.startMonitoring = void 0;
let startCpu;
let startMemory;
let samples = [];
let interval = null;
const startMonitoring = () => {
    samples = [];
    startCpu = process.cpuUsage();
    startMemory = process.memoryUsage();
    interval = setInterval(() => {
        const cpuUsage = process.cpuUsage(startCpu);
        const totalCpuTime = (cpuUsage.user + cpuUsage.system) / 1000; // en ms
        const memUsage = process.memoryUsage().rss / 1024 / 1024; // en MB
        samples.push({ cpu: totalCpuTime, ram: memUsage });
    }, 1000); // Muestreo cada segundo
};
exports.startMonitoring = startMonitoring;
const stopMonitoring = () => {
    if (interval)
        clearInterval(interval);
    if (samples.length === 0)
        return { avgCpu: 0, maxCpu: 0, avgRam: 0, maxRam: 0 };
    const totalCpu = samples.reduce((acc, s) => acc + s.cpu, 0);
    const totalRam = samples.reduce((acc, s) => acc + s.ram, 0);
    return {
        avgCpu: parseFloat((totalCpu / samples.length).toFixed(2)),
        maxCpu: Math.max(...samples.map(s => s.cpu)),
        avgRam: parseFloat((totalRam / samples.length).toFixed(2)),
        maxRam: Math.max(...samples.map(s => s.ram)),
    };
};
exports.stopMonitoring = stopMonitoring;
//# sourceMappingURL=monitor.js.map