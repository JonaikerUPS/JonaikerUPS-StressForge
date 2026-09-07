"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStressTest = void 0;
const TestRun_1 = require("../models/TestRun");
const tool_runner_1 = require("./tool-runner");
const monitor_1 = require("./monitor");
const emitter_1 = require("./emitter");
const runStressTest = async (testId, toolsToRun) => {
    try {
        const test = await TestRun_1.TestRun.findById(testId);
        if (!test)
            return;
        test.status = 'running';
        await test.save();
        console.log(`Ejecutando pruebas paralelas ${toolsToRun.join(', ')} contra ${test.targetUrl} (ID: ${testId})`);
        (0, monitor_1.startMonitoring)();
        const configs = toolsToRun.map(tool => ({
            tool,
            targetUrl: test.targetUrl.startsWith('http') ? test.targetUrl : `http://backend:8080`,
            concurrency: test.virtualUsers || 10,
            durationMs: test.durationMs || 10000,
            type: 'stress',
            endpoints: [{ endpoint: test.targetUrl.startsWith('http') ? '/' : test.targetUrl, method: 'GET' }]
        }));
        await (0, tool_runner_1.runParallelTools)(configs, (metrics) => {
            emitter_1.testEmitter.emit('test-update', { type: 'metrics', data: metrics });
        }, (tool, log) => {
            emitter_1.testEmitter.emit('test-update', { type: 'log', tool, log });
        }, (tool, finalMetrics) => {
            emitter_1.testEmitter.emit('test-update', { type: 'complete', tool, metrics: finalMetrics });
        });
        // ... (rest of logic for saving status)
        // Note: The parallel runner doesn't have a completion callback yet in this simple refactor.
        // I need to add one.
    }
    catch (err) {
        // ...
    }
};
exports.runStressTest = runStressTest;
//# sourceMappingURL=executor.js.map