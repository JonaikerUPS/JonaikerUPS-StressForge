import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const performAdvancedPing = async (host: string, packets: number = 4) => {
    try {
        // -c: packets count
        // -q: quiet output
        const { stdout } = await execPromise(`ping -c ${packets} -q ${host}`);
        
        // Formato típico de salida:
        // --- google.com ping statistics ---
        // 4 packets transmitted, 4 received, 0% packet loss, time 3004ms
        // rtt min/avg/max/mdev = 15.123/15.456/16.123/0.456 ms
        
        const lossMatch = stdout.match(/(\d+)% packet loss/);
        const rttMatch = stdout.match(/rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)/);
        
        const packetLoss = lossMatch ? parseFloat(lossMatch[1]) : 100;
        const latencyAvg = rttMatch ? parseFloat(rttMatch[2]) : 0;
        const jitter = rttMatch ? parseFloat(rttMatch[4]) : 0;
        
        return { 
            success: packetLoss < 100, 
            latency: latencyAvg, 
            packetLoss, 
            jitter 
        };
    } catch (e) {
        return { success: false, latency: 0, packetLoss: 100, jitter: 0 };
    }
};

export const performNmapScan = async (target: string) => {
    // Basic sanitization to prevent command injection
    if (!/^[a-zA-Z0-9.-]+$/.test(target)) {
        throw new Error("Invalid target format");
    }
    // -F: Fast mode (scans top 100 ports)
    // -T4: Faster execution
    const { stdout } = await execPromise(`nmap -F -T4 ${target}`);
    return stdout;
};
