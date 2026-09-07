import { ToolAdapter } from "./base-adapter";
import { UnifiedMetrics } from "../types/metrics";
export declare class K6Adapter implements ToolAdapter {
    private buffer;
    private accumulatedMetrics;
    parse(rawOutput: string): UnifiedMetrics | null;
}
//# sourceMappingURL=k6.d.ts.map