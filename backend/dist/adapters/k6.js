"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.K6Adapter = void 0;
class K6Adapter {
    buffer = "";
    accumulatedMetrics = { durationSum: 0, count: 0, failed: 0 };
    parse(rawOutput) {
        this.buffer += rawOutput;
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || "";
        let updated = false;
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const data = JSON.parse(line);
                if (data.type === 'Point') {
                    const metricName = data.metric;
                    const metricValue = data.data && data.data.value !== undefined ? data.data.value : data.value;
                    if (metricName === 'http_req_duration') {
                        this.accumulatedMetrics.durationSum += metricValue;
                        updated = true;
                    }
                    else if (metricName === 'http_reqs') {
                        this.accumulatedMetrics.count += metricValue;
                        updated = true;
                    }
                    else if (metricName === 'http_req_failed') {
                        this.accumulatedMetrics.failed += metricValue;
                        updated = true;
                    }
                }
            }
            catch (e) {
                // Ignorar
            }
        }
        if (!updated)
            return null;
        return {
            tool: "k6",
            timestamp: Date.now(),
            latency: {
                avg: this.accumulatedMetrics.count > 0 ? this.accumulatedMetrics.durationSum / this.accumulatedMetrics.count : 0,
                p95: 0,
                p99: 0
            },
            throughput: this.accumulatedMetrics.count,
            errorRate: this.accumulatedMetrics.count > 0 ? (this.accumulatedMetrics.failed / this.accumulatedMetrics.count) * 100 : 0,
            cpuUsage: 0,
            ramUsage: 0,
        };
    }
}
exports.K6Adapter = K6Adapter;
//# sourceMappingURL=k6.js.map