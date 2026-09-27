import { TestTool } from './tool-runner';
export declare const runStressTest: (testId: string, toolsToRun: TestTool[], targetUrl: string, concurrency: number, durationMs: number, endpoints?: {
    endpoint: string;
    method: string;
    requestBody?: string;
}[], requests?: number, category?: string, isCustomYaml?: boolean, customYaml?: string) => Promise<void>;
//# sourceMappingURL=executor.d.ts.map