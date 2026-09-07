import { UnifiedMetrics } from "../types/metrics";
export interface ToolAdapter {
    parse(rawOutput: string): UnifiedMetrics | null;
}
//# sourceMappingURL=base-adapter.d.ts.map