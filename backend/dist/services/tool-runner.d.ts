import { ChildProcess } from 'child_process';
import { UnifiedMetrics } from '../types/metrics';
export declare const activeProcesses: Map<string, ChildProcess[]>;
export type TestTool = 'jmeter' | 'locust' | 'k6' | 'artillery' | 'taurus' | 'hey' | 'bombardier' | 'vegeta' | 'gatling' | 'autocannon' | 'simulacion' | 'nmap' | 'masscan' | 'nikto' | 'hydra' | 'sqlmap' | 'gobuster' | 'wfuzz' | 'ffuf' | 'hping3' | 'ab' | 'slowloris';
export interface TestConfig {
    testId?: string;
    tool: TestTool;
    type: string;
    durationMs: number;
    concurrency: number;
    requests?: number;
    rampUp?: number;
    scenario?: string;
    targetUrl: string;
    headers?: string;
    body?: string;
    endpoints?: {
        endpoint: string;
        method: string;
        requestBody?: string;
    }[];
    maxLatency?: number;
    isCustomYaml?: boolean;
    customYaml?: string;
    payloadType?: 'JSON' | 'Form URL-Encoded' | 'XML' | 'Cargar Archivo';
    filePath?: string;
    isMultipart?: boolean;
    fileParamName?: string;
}
export interface PerEndpointMetrics {
    url: string;
    method: string;
    totalRequests: number;
    successCount: number;
    failCount: number;
    avgLatency: number;
    p95: number;
    p99: number;
    status: 'success' | 'error';
}
export declare function runParallelTools(configs: TestConfig[], onMetrics: (metrics: UnifiedMetrics) => void, onLog: (tool: TestTool, log: string) => void, onComplete: (tool: TestTool, finalMetrics: UnifiedMetrics | null) => void): Promise<PerEndpointMetrics[]>;
export declare function checkToolAvailable(tool: TestTool): Promise<boolean>;
//# sourceMappingURL=tool-runner.d.ts.map