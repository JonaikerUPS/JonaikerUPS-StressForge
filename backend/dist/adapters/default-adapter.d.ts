import { ToolAdapter } from "./base-adapter";
import { UnifiedMetrics } from "../types/metrics";
export declare class DefaultAdapter implements ToolAdapter {
    private toolName;
    constructor(toolName: string);
    parse(rawOutput: string): UnifiedMetrics | null;
}
//# sourceMappingURL=default-adapter.d.ts.map