import { UnifiedMetrics } from "../types/metrics";

export interface ToolAdapter {
  parse(rawOutput: string): UnifiedMetrics | null;
}
