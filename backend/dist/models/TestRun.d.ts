export interface ITestRun {
    targetUrl: string;
    toolUsed: string;
    virtualUsers: number;
    durationMs?: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    results?: string;
    summary?: {
        totalRequests: number;
        successful: number;
        failed: number;
        avgLatency: number;
        minLatency: number;
        maxLatency: number;
        p95: number;
        p99: number;
        throughput: number;
        durationMs: number;
        cpuUsage?: number;
        ramUsage?: number;
        concurrency?: number;
    };
    rawOutput?: string;
    createdAt: Date;
}
export declare const TestRun: import("mongoose").Model<ITestRun, {}, {}, {}, import("mongoose").Document<unknown, {}, ITestRun, {}, import("mongoose").DefaultSchemaOptions> & ITestRun & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, ITestRun>;
//# sourceMappingURL=TestRun.d.ts.map