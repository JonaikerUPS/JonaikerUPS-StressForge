"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtilleryAdapter = void 0;
class ArtilleryAdapter {
    buffer = "";
    parse(rawOutput) {
        this.buffer += rawOutput;
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || "";
        let latestMetrics = null;
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const data = JSON.parse(line);
                // Ajuste según estructura típica de Artillery (JSON lines)
                if (data.aggregate) {
                    latestMetrics = {
                        tool: "artillery",
                        timestamp: Date.now(),
                        latency: {
                            avg: data.aggregate.latency.mean,
                            p95: data.aggregate.latency.p95,
                            p99: data.aggregate.latency.p99 || 0
                        },
                        throughput: data.aggregate.requestsPerSecond.mean,
                        errorRate: data.aggregate.codes ? (data.aggregate.codes[500] || 0) / (data.aggregate.requestsCompleted || 1) * 100 : 0,
                        cpuUsage: 0,
                        ramUsage: 0
                    };
                }
            }
            catch { }
        }
        return latestMetrics;
    }
}
exports.ArtilleryAdapter = ArtilleryAdapter;
//# sourceMappingURL=artillery.js.map