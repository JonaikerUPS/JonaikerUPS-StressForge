import { UnifiedMetrics } from '../types/metrics';
export type TestTool = 'jmeter' | 'locust' | 'k6' | 'artillery' | 'taurus' | 'hey' | 'bombardier' | 'vegeta' | 'gatling' | 'autocannon' | 'simulacion';
export interface TestConfig {
    tool: TestTool;
    type: string;
    durationMs: number;
    concurrency: number;
    rampUp?: number;
    scenario?: string;
    targetUrl: string;
    endpoints?: {
        endpoint: string;
        method: string;
        requestBody?: string;
    }[];
}
export declare function getCommand(config: TestConfig): string;
export declare function runParallelTools(configs: TestConfig[], onMetrics: (metrics: UnifiedMetrics) => void, onLog: (tool: TestTool, log: string) => void, onComplete: (tool: TestTool, finalMetrics: UnifiedMetrics | null) => void): Promise<void>;
export declare function checkToolAvailable(tool: TestTool): Promise<boolean>;
//# sourceMappingURL=tool-runner.d.ts.map