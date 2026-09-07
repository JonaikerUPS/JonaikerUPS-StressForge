"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
exports.runParallelTools = runParallelTools;
exports.checkToolAvailable = checkToolAvailable;
const child_process_1 = require("child_process");
function getCommand(config) {
    const { tool, targetUrl, concurrency, durationMs } = config;
    const durSec = Math.max(3, Math.floor(durationMs / 1000));
    switch (tool) {
        case 'k6': return `/usr/local/bin/k6 run /app/tests/script.js --vus ${concurrency} --duration ${durSec}s -e TARGET_URL=${targetUrl}`;
        case 'artillery': return `npx artillery run /app/tests/artillery-config.yml`;
        case 'autocannon': return `npx autocannon -c ${concurrency} -d ${durSec} ${targetUrl}`;
        case 'hey': return `/usr/bin/hey -n 1000 -c ${concurrency} ${targetUrl}`;
        case 'vegeta': return `echo "GET ${targetUrl}" | /root/go/bin/vegeta attack -rate=${concurrency} -duration=${durSec}s | /root/go/bin/vegeta report`;
        case 'bombardier': return `/usr/bin/bombardier -c ${concurrency} -n 1000 ${targetUrl}`;
        case 'jmeter': return `jmeter -n -t /app/tests/plan.jmx -Jconcurrency=${concurrency} -Jduration=${durSec}`;
        case 'locust': return `locust -f /app/tests/locustfile.py --headless -u ${concurrency} -r ${concurrency} --run-time ${durSec}s --host ${targetUrl}`;
        case 'taurus': return `bzt /app/tests/taurus-config.yml`;
        case 'simulacion': return `node /app/tests/simulacion-load.js ${targetUrl} ${concurrency}`;
        default: return `echo "Unsupported tool: ${tool}"`;
    }
}
async function runParallelTools(configs, onMetrics, onLog, onComplete) {
    configs.forEach((config) => {
        const cmd = getCommand(config);
        onLog(config.tool, `[INFO] Ejecutando: ${cmd}`);
        const child = (0, child_process_1.exec)(cmd);
        child.stdout?.on('data', (data) => onLog(config.tool, data.toString()));
        child.stderr?.on('data', (data) => onLog(config.tool, `[ERROR] ${data.toString()}`));
        child.on('close', (code) => {
            onLog(config.tool, `[INFO] Finalizado con código ${code}`);
            onComplete(config.tool, null);
        });
    });
}
async function checkToolAvailable(tool) {
    return true;
}
//# sourceMappingURL=tool-runner.js.map