import os from 'os';

let samples: { cpuUsage: number; usedRamGB: number; totalRamGB: number }[] = [];
let interval: NodeJS.Timeout | null = null;
let prevCpuTimes = { idle: 0, total: 0 };

export const startMonitoring = () => {
  samples = [];
  
  // Initialize prevCpuTimes
  const cpus = os.cpus();
  prevCpuTimes.idle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  prevCpuTimes.total = cpus.reduce((acc, cpu) => 
      acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);

  console.log("Monitoring started");
  interval = setInterval(() => {
    // CPU Usage percentage
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) {
        console.log("No CPU info available");
        return;
    }
    const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const totalTick = cpus.reduce((acc, cpu) => 
        acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq, 0);
    
    const idleDiff = totalIdle - prevCpuTimes.idle;
    const totalDiff = totalTick - prevCpuTimes.total;
    
    const cpuUsage = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
    
    prevCpuTimes = { idle: totalIdle, total: totalTick };

    // RAM usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = (totalMem - freeMem);
    
    const sample = { 
        cpuUsage: parseFloat(cpuUsage.toFixed(2)), 
        usedRamGB: parseFloat((usedMem / 1024 / 1024 / 1024).toFixed(2)),
        totalRamGB: parseFloat((totalMem / 1024 / 1024 / 1024).toFixed(2))
    };
    samples.push(sample);
    console.log("New sample:", sample);
  }, 5000); // Muestreo cada 5 segundos
};


export const getLatestSample = () => {
  if (samples.length === 0) return { cpuUsage: 0, usedRamGB: 0, totalRamGB: 0 };
  return samples[samples.length - 1];
};

export const stopMonitoring = () => {
  if (interval) clearInterval(interval);
  
  if (samples.length === 0) return { avgCpu: 0, maxCpu: 0, avgRam: 0, maxRam: 0 };

  const totalCpu = samples.reduce((acc, s) => acc + s.cpuUsage, 0);
  const totalRam = samples.reduce((acc, s) => acc + s.usedRamGB, 0);
  
  return {
    avgCpu: parseFloat((totalCpu / samples.length).toFixed(2)),
    maxCpu: Math.max(...samples.map(s => s.cpuUsage)),
    avgRam: parseFloat((totalRam / samples.length).toFixed(2)),
    maxRam: Math.max(...samples.map(s => s.usedRamGB)),
  };
};
