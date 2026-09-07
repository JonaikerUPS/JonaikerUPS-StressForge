"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAdapter = void 0;
class DefaultAdapter {
    toolName;
    constructor(toolName) {
        this.toolName = toolName;
    }
    parse(rawOutput) {
        // Regex mejorados para detectar métricas y errores
        const throughputRegexes = [/(?:Requests\/sec|Req\/Sec|Throughput|RPS):\s*([\d.]+)/i];
        const latencyRegexes = [/(?:Average|Avg|Mean)\s+(?:latency|lat|time)?:\s*([\d.]+)/i];
        const errorRegexes = [/error|failed|refused|not found|timeout/i];
        let throughput = 0;
        for (const re of throughputRegexes) {
            const match = rawOutput.match(re);
            if (match) {
                throughput = parseFloat(match[1]);
                break;
            }
        }
        let avg = 0;
        for (const re of latencyRegexes) {
            const match = rawOutput.match(re);
            if (match) {
                avg = parseFloat(match[1]);
                break;
            }
        }
        let hasError = false;
        for (const re of errorRegexes) {
            if (rawOutput.match(re)) {
                hasError = true;
                break;
            }
        }
        if (throughput === 0 && avg === 0 && !hasError)
            return null;
        return {
            tool: this.toolName,
            timestamp: Date.now(),
            latency: { avg: avg, p95: avg * 1.2, p99: avg * 1.5 },
            throughput: throughput,
            errorRate: hasError ? 1 : 0, // <-- Marcamos error
            cpuUsage: 0,
            ramUsage: 0,
        };
    }
}
exports.DefaultAdapter = DefaultAdapter;
//# sourceMappingURL=default-adapter.js.map