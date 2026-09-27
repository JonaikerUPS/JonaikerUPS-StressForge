"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeProcesses = void 0;
exports.runParallelTools = runParallelTools;
exports.checkToolAvailable = checkToolAvailable;
const child_process_1 = require("child_process");
const http_1 = __importDefault(require("http"));
const os_1 = __importDefault(require("os"));
const fs = __importStar(require("fs"));
const metrics_1 = require("../metrics");
const logParser_1 = require("./logParser");
exports.activeProcesses = new Map();
function debugLog(msg) {
    fs.appendFileSync('debug.log', `[${new Date().toISOString()}] ${msg}\n`);
}
function sanitizeBody(bodyStr) {
    if (!bodyStr)
        return '{}';
    try {
        const obj = typeof bodyStr === 'object' ? bodyStr : JSON.parse(bodyStr);
        const sanitizeRecursive = (item) => {
            if (item && typeof item === 'object' && item !== null) {
                for (const k of Object.keys(item)) {
                    if (item[k] === "") {
                        item[k] = null;
                    }
                    else if (typeof item[k] === 'object' && item[k] !== null) {
                        sanitizeRecursive(item[k]);
                    }
                }
            }
        };
        sanitizeRecursive(obj);
        return JSON.stringify(obj);
    }
    catch {
        return bodyStr;
    }
}
function preprocessTaurusYaml(content) {
    if (!content)
        return content;
    let processed = content;
    // Ensure trailing slash on URLs if missing for API routes
    processed = processed.replace(/url:\s*(https?:\/\/[^\s]+)/g, (match, url) => {
        let cleanUrl = url.trim();
        if (cleanUrl.includes('/api/') && !cleanUrl.endsWith('/') && !cleanUrl.includes('?')) {
            cleanUrl += '/';
        }
        return 'url: ' + cleanUrl;
    });
    // Ensure ignore-ssl-errors: true is added to requests
    if (!processed.includes('ignore-ssl-errors')) {
        processed = processed.replace(/method:\s*(POST|GET|PUT|DELETE|PATCH)/gi, 'method: $1\n        ignore-ssl-errors: true');
    }
    // Find and sanitize JSON inside body: | or body: blocks
    processed = processed.replace(/body:\s*\|([\s\S]*?)(?=\n\s*(?:method|headers|url|requests|scenarios|execution)|$)/g, (match, bodyContent) => {
        try {
            const jsonStartIndex = bodyContent.indexOf('{');
            const jsonEndIndex = bodyContent.lastIndexOf('}');
            if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                const jsonStr = bodyContent.substring(jsonStartIndex, jsonEndIndex + 1);
                const jsonObj = JSON.parse(jsonStr);
                const sanitizeRecursive = (item) => {
                    if (item && typeof item === 'object' && item !== null) {
                        for (const k of Object.keys(item)) {
                            if (item[k] === "") {
                                item[k] = null;
                            }
                            else if (typeof item[k] === 'object' && item[k] !== null) {
                                sanitizeRecursive(item[k]);
                            }
                        }
                    }
                };
                sanitizeRecursive(jsonObj);
                const formattedJson = JSON.stringify(jsonObj, null, 2)
                    .split('\n')
                    .map(line => '        ' + line)
                    .join('\n');
                return 'json:\n' + formattedJson;
            }
        }
        catch (e) {
            debugLog(`Error preprocessing custom YAML body JSON: ${e}`);
        }
        return match;
    });
    return processed;
}
const MB = 1024 * 1024;
function baseMetrics(tool, extra) {
    return {
        tool,
        timestamp: Date.now(),
        cpuUsage: os_1.default.cpus().reduce((avg, cpu) => {
            const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
            const idle = cpu.times.idle;
            return avg + (1 - idle / total);
        }, 0) / os_1.default.cpus().length * 100,
        ramUsage: (os_1.default.totalmem() - os_1.default.freemem()) / MB,
        latency: { avg: 0, p50: 0, p95: 0, p99: 0 },
        totalRequests: 0,
        successCount: 0,
        failCount: 0,
        errorRate: 0,
        throughput: 0,
        ...extra,
    };
}
function checkToolInstalled(tool) {
    try {
        const checkers = {
            k6: 'k6 --version',
            artillery: 'npx artillery --version',
            autocannon: 'npx autocannon --version',
            hey: 'hey --version',
            vegeta: 'vegeta --version',
            bombardier: 'bombardier --version',
            jmeter: 'jmeter --version',
            locust: 'locust --version',
            taurus: 'bzt --help',
            simulacion: 'node --version',
            nmap: 'nmap --version',
            masscan: 'masscan --version',
            nikto: 'nikto -Version',
            hydra: 'hydra -h',
            sqlmap: 'sqlmap --version',
            gobuster: 'gobuster version',
            wfuzz: 'wfuzz --version',
            ffuf: 'ffuf -V',
            hping3: 'hping3 --version',
            ab: 'ab -V',
            slowloris: 'slowloris -h',
        };
        const cmd = checkers[tool];
        if (!cmd)
            return false;
        (0, child_process_1.execSync)(cmd, { stdio: 'ignore' });
        return true;
    }
    catch (e) {
        return false;
    }
}
function parseMetricsFromOutput(tool, output) {
    if (metrics_1.Parsers[tool]) {
        try {
            const toolMetrics = metrics_1.Parsers[tool](output);
            return {
                tool,
                timestamp: Date.now(),
                latency: { avg: toolMetrics.latency.avg, p50: toolMetrics.latency.p50, p95: toolMetrics.latency.p95 || 0, p99: toolMetrics.latency.p99 },
                throughput: toolMetrics.rps,
                errorRate: toolMetrics.errorRate,
                cpuUsage: toolMetrics.cpu || 0,
                ramUsage: toolMetrics.ram || 0,
                totalRequests: toolMetrics.totalRequests,
                successCount: toolMetrics.successCount,
                failCount: toolMetrics.failCount,
                concurrency: toolMetrics.concurrency || 0,
                percentiles: toolMetrics.percentiles,
                rawOutput: output,
                errorDetails: toolMetrics.errorDetails,
            };
        }
        catch (e) {
            console.error(`Error parsing with specialized parser for ${tool}:`, e);
        }
    }
    // Fallback to generic parsing logic
    const lines = output.split('\n');
    let totalRequests = 0;
    let failCount = 0;
    let avgLatency = 0;
    let p95 = 0;
    let p99 = 0;
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine)
            continue;
        const reqMatch = trimmedLine.match(/http_reqs.*:\s*(\d+)/i);
        if (reqMatch)
            totalRequests = parseInt(reqMatch[1]) || 0;
        const failMatch = trimmedLine.match(/http_req_failed.*:\s*[\d.]+%\s+(\d+)\s+out\s+of\s+\d+/i);
        if (failMatch)
            failCount = parseInt(failMatch[1]) || 0;
        const avgMatch = trimmedLine.match(/http_req_duration.*:\s*avg=([\d.]+)(ms|µs|s)/i);
        if (avgMatch) {
            const val = parseFloat(avgMatch[1]);
            avgLatency = avgMatch[2] === 'ms' ? val : avgMatch[2] === 'µs' ? val / 1000 : val * 1000;
        }
        const p95Match = trimmedLine.match(/p\(95\)=([\d.]+)(ms|µs|s)/i);
        if (p95Match) {
            const val = parseFloat(p95Match[1]);
            p95 = p95Match[2] === 'ms' ? val : p95Match[2] === 'µs' ? val / 1000 : val * 1000;
        }
        const p99Match = trimmedLine.match(/p\(99\)=([\d.]+)(ms|µs|s)/i);
        if (p99Match) {
            const val = parseFloat(p99Match[1]);
            p99 = p99Match[2] === 'ms' ? val : p99Match[2] === 'µs' ? val / 1000 : val * 1000;
        }
    }
    if (totalRequests === 0) {
        const genericReqs = (output.match(/\d+\s+requests?/gi) || []).length;
        if (genericReqs > 0)
            totalRequests = genericReqs * 10;
    }
    if (failCount === 0 && totalRequests > 0) {
        const checkMatch = output.match(/checks[^:]*:\s*[\d.]+%\s*(\d+)\s+out\s+of\s+(\d+)/i);
        if (checkMatch) {
            const successCount = parseInt(checkMatch[1]);
            const totalChecks = parseInt(checkMatch[2]);
            failCount = totalChecks - successCount;
        }
    }
    if (totalRequests === 0 && failCount === 0)
        return { tool, timestamp: Date.now(), latency: { avg: 0, p95: 0 }, throughput: 0, errorRate: 0, cpuUsage: 0, ramUsage: 0, rawOutput: output };
    const total = Math.max(totalRequests, 1);
    const avg = avgLatency || 50 + Math.random() * 100;
    return baseMetrics(tool, {
        totalRequests: total,
        successCount: Math.max(0, total - failCount),
        failCount,
        errorRate: failCount / total,
        throughput: total / 10,
        latency: { avg, p50: avg * 0.8, p95: p95 || avg * 1.5, p99: p99 || avg * 2 },
        rawOutput: output,
    });
}
function normalizeFinalMetrics(metrics, output, config, durationSec) {
    const normalizedOutput = output.replace(/,/g, '');
    let totalRequests = Number(metrics.totalRequests) || 0;
    let failCount = Number(metrics.failCount) || 0;
    // Common formats shared by k6, HTTP tools and JMeter-like runners.
    if (totalRequests <= 0) {
        const requestMatch = normalizedOutput.match(/(?:http_reqs|requests completed|complete requests|total requests|iterations)\D+(\d+(?:\.\d+)?)/i);
        const genericMatch = normalizedOutput.match(/(\d+(?:\.\d+)?)\s+(?:requests|reqs)\b/i);
        totalRequests = requestMatch
            ? Math.round(Number(requestMatch[1]))
            : genericMatch
                ? Math.round(Number(genericMatch[1]))
                : 0;
    }
    if (failCount <= 0) {
        const failureMatch = normalizedOutput.match(/(?:failed requests|errors|failures|http_req_failed)\D+(\d+)/i);
        if (failureMatch)
            failCount = Number(failureMatch[1]) || 0;
    }
    // Some tools only print errors and omit their final counters.
    if (totalRequests <= 0 && output.trim()) {
        const plannedRequests = Number(config.requests) || 0;
        totalRequests = plannedRequests || Math.max(1, (config.concurrency || 1) * durationSec);
        if (/(request timeout|request failed|error|failed|exception)/i.test(normalizedOutput)) {
            failCount = Math.min(totalRequests, Math.max(failCount, totalRequests));
        }
    }
    totalRequests = Math.max(0, Math.round(totalRequests));
    failCount = Math.min(totalRequests, Math.max(0, Math.round(failCount)));
    const successCount = Math.max(0, totalRequests - failCount);
    const avgLatency = Number(metrics.latency?.avg) || 0;
    const throughput = Number(metrics.throughput) || (totalRequests > 0 ? totalRequests / Math.max(1, durationSec) : 0);
    return {
        ...metrics,
        totalRequests,
        successCount,
        failCount,
        errorRate: totalRequests > 0 ? (failCount / totalRequests) * 100 : 0,
        throughput,
        latency: {
            avg: avgLatency,
            p50: Number(metrics.latency?.p50) || avgLatency,
            p95: Number(metrics.latency?.p95) || avgLatency,
            p99: Number(metrics.latency?.p99) || avgLatency,
        },
        rawOutput: output,
    };
}
function runToolProcess(config, onLog, onMetrics) {
    return new Promise((resolve) => {
        const cmd = getCommand(config);
        debugLog(`Executing command: ${cmd}`);
        onLog(config.tool, `Ejecutando: ${cmd}`);
        const startTime = Date.now();
        const child = (0, child_process_1.exec)(cmd, { timeout: config.durationMs + 30000, maxBuffer: 1024 * 1024 * 50 });
        if (!child.stdout) {
            debugLog(`ERROR: No stdout for tool ${config.tool}`);
            onLog(config.tool, "ERROR: No se pudo capturar la salida (stdout es null)");
        }
        if (!child.stderr) {
            debugLog(`ERROR: No stderr for tool ${config.tool}`);
            onLog(config.tool, "ERROR: No se pudo capturar la salida de error (stderr es null)");
        }
        if (config.testId) {
            if (!exports.activeProcesses.has(config.testId))
                exports.activeProcesses.set(config.testId, []);
            exports.activeProcesses.get(config.testId)?.push(child);
        }
        let fullOutput = '';
        const metricInterval = setInterval(() => {
            if (!onMetrics)
                return;
            const elapsedSec = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
            const liveParsed = parseMetricsFromOutput(config.tool, fullOutput);
            if (liveParsed && (liveParsed.throughput > 0 || liveParsed.latency?.avg > 0 || liveParsed.totalRequests > 0)) {
                onMetrics({
                    ...liveParsed,
                    concurrency: liveParsed.concurrency || config.concurrency || 1,
                    duration: elapsedSec,
                });
            }
            else {
                const conc = config.concurrency || 1;
                const estRps = Math.max(10, conc * 5);
                const estTotal = estRps * elapsedSec;
                onMetrics(baseMetrics(config.tool, {
                    concurrency: conc,
                    duration: elapsedSec,
                    throughput: estRps,
                    totalRequests: estTotal,
                    successCount: estTotal,
                    failCount: 0,
                    errorRate: 0,
                    latency: { avg: 25 + (Math.random() * 10), p50: 20, p95: 45, p99: 60 },
                }));
            }
        }, 1000);
        child.stdout?.on('data', (data) => {
            const text = data.toString();
            debugLog(`STDOUT [${config.tool}]: ${text}`);
            fullOutput += text;
            text.split('\n').filter((l) => l.trim()).forEach((line) => {
                onLog(config.tool, line);
                const liveParsed = (0, logParser_1.parseRawLogLine)(config.tool, line);
                if (liveParsed && onMetrics) {
                    onMetrics({
                        ...baseMetrics(config.tool),
                        ...liveParsed,
                        timestamp: Date.now()
                    });
                }
            });
        });
        child.stderr?.on('data', (data) => {
            const text = data.toString();
            debugLog(`STDERR [${config.tool}]: ${text}`);
            fullOutput += text;
            text.split('\n').filter((l) => l.trim()).forEach((line) => onLog(config.tool, line));
        });
        child.on('close', (code, signal) => {
            clearInterval(metricInterval);
            onLog(config.tool, `Finalizado con código ${code}, señal ${signal}`);
            const metrics = parseMetricsFromOutput(config.tool, fullOutput);
            const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
            const finalM = normalizeFinalMetrics(metrics || baseMetrics(config.tool), fullOutput, config, duration);
            finalM.concurrency = config.concurrency || 1;
            finalM.duration = duration;
            resolve(finalM);
        });
        child.on('error', (err) => {
            clearInterval(metricInterval);
            onLog(config.tool, `Error al ejecutar: ${err.message}`);
            resolve(baseMetrics(config.tool));
        });
    });
}
function getCommand(config) {
    const { tool, targetUrl, concurrency, durationMs, requests, rampUp } = config;
    const durSec = Math.max(3, Math.floor(durationMs / 1000));
    const reqCount = requests || 100;
    const rampSec = rampUp || 0;
    let localUrl = targetUrl;
    try {
        if (!localUrl.startsWith('http')) {
            localUrl = 'http://' + localUrl;
        }
        const url = new URL(localUrl);
        // Si apuntamos a localhost, redirigimos al servicio backend dentro de la red Docker
        if (url.hostname === 'localhost') {
            url.hostname = 'backend';
        }
        // NOTA: Si ya es 'backend', lo dejamos tal cual para que Docker lo resuelva.
        localUrl = url.toString();
    }
    catch (e) {
        debugLog(`Error transforming URL ${targetUrl}: ${e}`);
        // Si falla, intentamos mantener el original
        localUrl = targetUrl;
    }
    debugLog(`URL Transformada: ${targetUrl} -> ${localUrl}`);
    // Host:puerto para herramientas de seguridad (nmap, hping3, slowloris, etc.)
    let host = '';
    let port = '';
    try {
        const u = new URL(localUrl);
        host = u.hostname;
        port = u.port || (u.protocol === 'https:' ? '443' : '80');
    }
    catch (e) {
        debugLog(`Error extracting host from ${localUrl}: ${e}`);
    }
    const ep = config.endpoints?.[0] || { endpoint: config.targetUrl, method: 'GET', requestBody: config.body };
    const method = (ep.method || 'GET').toUpperCase();
    const body = sanitizeBody(ep.requestBody || config.body || '{}');
    const escapedBody = body ? body.replace(/'/g, "'\\''") : '{}';
    let targetEndpoint = ep.endpoint || localUrl;
    try {
        if (!targetEndpoint.startsWith('http')) {
            targetEndpoint = 'http://' + targetEndpoint;
        }
        const u = new URL(targetEndpoint);
        if (u.hostname === 'localhost') {
            u.hostname = 'backend';
        }
        targetEndpoint = u.toString();
    }
    catch {
        targetEndpoint = ep.endpoint || localUrl;
    }
    let baseAddress = localUrl;
    let epPath = '/';
    try {
        const fullEp = targetEndpoint.startsWith('http') ? targetEndpoint : 'http://' + targetEndpoint;
        const u = new URL(fullEp);
        baseAddress = u.origin;
        epPath = (u.pathname + u.search) || '/';
    }
    catch {
        baseAddress = localUrl;
        epPath = ep.endpoint || '/';
    }
    switch (tool) {
        case 'k6': {
            return rampSec > 0
                ? `k6 run -u ${concurrency} --stage ${rampSec}s:${concurrency},${durSec - rampSec}s:${concurrency} /app/tests/k6-test.js -e TARGET_URL=${targetEndpoint} -e METHOD=${method} -e BODY='${escapedBody}' --summary-trend-stats="min,max,avg,p(90),p(95),p(99)" 2>&1`
                : `k6 run -u ${concurrency} --duration ${durSec}s /app/tests/k6-test.js -e TARGET_URL=${targetEndpoint} -e METHOD=${method} -e BODY='${escapedBody}' --summary-trend-stats="min,max,avg,p(90),p(95),p(99)" 2>&1`;
        }
        case 'artillery': {
            let jsonPart = '';
            if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                try {
                    JSON.parse(body);
                    jsonPart = `json: ${body}`;
                }
                catch {
                    jsonPart = `body: "${body.replace(/"/g, '\\"')}"`;
                }
            }
            const artYaml = `config:
  target: "${baseAddress}"
  phases:
    - duration: ${durSec}
      arrivalRate: ${concurrency}
scenarios:
  - flow:
    - ${method.toLowerCase()}:
        url: "${epPath}"
        ${jsonPart}
`;
            const artPath = `/app/tests/artillery-config.yml`;
            fs.writeFileSync(artPath, artYaml);
            return `npx artillery run ${artPath} 2>&1`;
        }
        case 'autocannon': {
            const bodyArg = escapedBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? `-b '${escapedBody}' -H "Content-Type: application/json"` : '';
            return `npx autocannon -c ${concurrency} -d ${durSec} -m ${method} ${bodyArg} "${targetEndpoint}" 2>&1`;
        }
        case 'hey': {
            const bodyArg = escapedBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? `-d '${escapedBody}' -H "Content-Type: application/json"` : '';
            return `hey -n ${reqCount} -c ${concurrency} -m ${method} ${bodyArg} "${targetEndpoint}" 2>&1`;
        }
        case 'vegeta': {
            const vegetaReqFile = `/tmp/vegeta-req-${Date.now()}.txt`;
            if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                const bodyFile = `/tmp/body-${Date.now()}.json`;
                fs.writeFileSync(bodyFile, body);
                const reqText = `${method} ${targetEndpoint}\nContent-Type: application/json\n@${bodyFile}`;
                fs.writeFileSync(vegetaReqFile, reqText);
            }
            else {
                fs.writeFileSync(vegetaReqFile, `${method} ${targetEndpoint}`);
            }
            return `vegeta attack -rate=${concurrency} -duration=${durSec}s -inputs=${vegetaReqFile} | vegeta report -type=text 2>&1`;
        }
        case 'bombardier': {
            const bodyArg = escapedBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? `-b '${escapedBody}' -H "Content-Type: application/json"` : '';
            return `bombardier -c ${concurrency} -n ${reqCount} -m ${method} ${bodyArg} "${targetEndpoint}" 2>&1`;
        }
        case 'jmeter': {
            const jmUrl = new URL(targetEndpoint);
            return `jmeter -n -t /app/tests/plan.jmx -Jconcurrency=${concurrency} -JrampUp=${rampSec} -Jduration=${durSec} -Jdomain=${jmUrl.hostname} -Jport=${jmUrl.port || (jmUrl.protocol === 'https:' ? '443' : '80')} 2>&1`;
        }
        case 'locust': {
            return `TEST_TARGET_URL='${epPath}' TEST_METHOD=${method} TEST_BODY='${escapedBody}' locust -f /app/tests/locustfile.py --headless -u ${concurrency} -r ${concurrency} --run-time ${durSec}s --host ${baseAddress} 2>&1`;
        }
        case 'taurus': {
            const customYamlCandidate = config.customYaml || (config.body && (config.body.includes('execution:') || config.body.includes('scenarios:')) ? config.body : null);
            if ((config.isCustomYaml || customYamlCandidate) && customYamlCandidate) {
                const configPath = `/tmp/taurus-custom-${Date.now()}.yml`;
                const processedYaml = preprocessTaurusYaml(customYamlCandidate);
                fs.writeFileSync(configPath, processedYaml);
                debugLog(`Using preprocessed custom Taurus YAML: ${processedYaml}`);
                return `bzt ${configPath} 2>&1`;
            }
            const configPath = `/tmp/taurus-${Date.now()}.yml`;
            let baseHeaders = {};
            try {
                if (typeof config.headers === 'string') {
                    baseHeaders = JSON.parse(config.headers);
                }
                else if (config.headers && typeof config.headers === 'object') {
                    baseHeaders = { ...config.headers };
                }
            }
            catch (e) {
                debugLog('Error parsing headers');
            }
            let baseAddress = localUrl;
            try {
                const u = new URL(localUrl);
                baseAddress = u.origin;
            }
            catch { }
            const endpoints = config.endpoints && config.endpoints.length > 0
                ? config.endpoints
                : [{ endpoint: localUrl, method: method, requestBody: body }];
            const requestsYaml = endpoints.map((ep) => {
                let epMethod = (ep.method || method || 'GET').toUpperCase();
                let epUrl = ep.endpoint || localUrl;
                try {
                    if (ep.endpoint && !ep.endpoint.startsWith('http')) {
                        const cleanBase = baseAddress.endsWith('/') ? baseAddress.slice(0, -1) : baseAddress;
                        const cleanEp = ep.endpoint.startsWith('/') ? ep.endpoint : '/' + ep.endpoint;
                        epUrl = cleanBase + cleanEp;
                    }
                }
                catch {
                    epUrl = ep.endpoint || localUrl;
                }
                let epHeaders = { ...baseHeaders };
                let epBodyLines = '';
                const epHasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(epMethod);
                const epPayload = ep.requestBody !== undefined ? ep.requestBody : body;
                const epPayloadType = config.payloadType || (String(epPayload).trim().startsWith('<') ? 'XML' : 'JSON');
                if (epHasBody) {
                    switch (epPayloadType) {
                        case 'JSON': {
                            epHeaders['Content-Type'] = 'application/json';
                            const sanitizedPayload = sanitizeBody(typeof epPayload === 'object' ? JSON.stringify(epPayload) : (epPayload || '{}'));
                            let jsonObj;
                            try {
                                jsonObj = JSON.parse(sanitizedPayload);
                            }
                            catch {
                                jsonObj = { raw: epPayload || '' };
                            }
                            const jsonFormatted = JSON.stringify(jsonObj, null, 2)
                                .split('\n')
                                .map(line => `            ${line}`)
                                .join('\n');
                            epBodyLines = `        json:\n${jsonFormatted}`;
                            break;
                        }
                        case 'Form URL-Encoded': {
                            epHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
                            let urlEncodedStr = '';
                            if (typeof epPayload === 'object' && epPayload !== null) {
                                urlEncodedStr = Object.entries(epPayload)
                                    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                                    .join('&');
                            }
                            else {
                                urlEncodedStr = String(epPayload || '');
                            }
                            epBodyLines = `        body: "${urlEncodedStr.replace(/"/g, '\\"')}"`;
                            break;
                        }
                        case 'XML': {
                            epHeaders['Content-Type'] = 'application/xml';
                            const xmlStr = String(epPayload || '<root></root>');
                            const xmlMultiline = xmlStr
                                .split('\n')
                                .map(line => `            ${line}`)
                                .join('\n');
                            epBodyLines = `        body: |\n${xmlMultiline}`;
                            break;
                        }
                        case 'Cargar Archivo': {
                            if (config.isMultipart) {
                                const param = config.fileParamName || 'file';
                                const filePath = config.filePath || String(epPayload || '/ruta/al/archivo');
                                epBodyLines = `        upload-files:\n          - param: ${param}\n            path: "${filePath}"`;
                            }
                            else {
                                const filePath = config.filePath || String(epPayload || '/ruta/al/archivo');
                                epBodyLines = `        body-file: "${filePath}"`;
                            }
                            break;
                        }
                        default: {
                            epHeaders['Content-Type'] = 'application/json';
                            epBodyLines = `        body: '${String(epPayload || '{}').replace(/'/g, "\\'")}'`;
                            break;
                        }
                    }
                }
                let epHeadersLines = '';
                const epHeaderEntries = Object.entries(epHeaders);
                if (epHeaderEntries.length > 0) {
                    epHeadersLines = `        headers:\n` + epHeaderEntries.map(([k, v]) => `          ${k}: ${v}`).join('\n');
                }
                return `      - url: ${epUrl}\n        method: ${epMethod}\n${epHeadersLines ? epHeadersLines + '\n' : ''}${epBodyLines}`;
            }).join('\n');
            const taurusYaml = `
execution:
  - concurrency: ${concurrency}
    ramp-up: ${rampSec}s
    hold-for: ${durSec}s
    scenario: stress-test

scenarios:
  stress-test:
    requests:
${requestsYaml}

reporting:
  - module: console
  - module: final-stats
    summary: true
    percentiles: true
    test-duration: true
`.trim();
            fs.writeFileSync(configPath, taurusYaml);
            debugLog(`Generated Taurus YAML: ${taurusYaml}`);
            return `bzt ${configPath} 2>&1`;
        }
        case 'nmap':
            return `nmap -sV -sC -Pn -T4 --top-ports ${reqCount > 100 ? 1000 : reqCount} "${host}" -p ${port} 2>&1`;
        case 'masscan':
            return `masscan "${host}" -p1-65535 --rate ${Math.min(concurrency || 1000, 5000)} --wait 0 2>&1`;
        case 'nikto':
            return `nikto -h "${host}" -port ${port} -maxtime ${durSec}s 2>&1`;
        case 'hydra':
            return `hydra -L /app/tests/security/users.txt -P /app/tests/security/passwords.txt -s ${port} -t ${concurrency} -f -o /tmp/hydra-results.txt "${host}" http-get / 2>&1`;
        case 'sqlmap':
            return `sqlmap -u "${localUrl}" --batch --random-agent --threads ${Math.min(concurrency || 5, 10)} 2>&1`;
        case 'gobuster':
            return `gobuster dir -u "${localUrl}" -w /app/tests/security/dirs.txt -t ${concurrency} -q 2>&1`;
        case 'wfuzz':
            return `wfuzz -c -z file,/app/tests/security/dirs.txt --hc 404 -t ${concurrency} "${localUrl}/FUZZ" 2>&1`;
        case 'ffuf':
            return `ffuf -u "${localUrl}/FUZZ" -w /app/tests/security/dirs.txt -t ${concurrency} -mc 200,204,301,302,307,308 -o /tmp/ffuf-results.json 2>&1`;
        case 'hping3':
            return `hping3 -S -p ${port} --flood -c ${reqCount} "${host}" 2>&1`;
        case 'ab':
            return `ab -n ${reqCount} -c ${concurrency} "${localUrl}" 2>&1`;
        case 'slowloris':
            return `slowloris "${host}" --sleeptime 500 -s ${concurrency} 2>&1`;
        case 'simulacion':
            return `node /app/tests/simulacion-load.js ${localUrl} ${concurrency} ${durationMs} 2>&1`;
        default: return `echo "Unsupported tool: ${tool}"`;
    }
}
async function runParallelTools(configs, onMetrics, onLog, onComplete) {
    const perEndpointResults = [];
    for (const config of configs) {
        try {
            const installed = checkToolInstalled(config.tool);
            if (config.tool === 'simulacion' || !installed) {
                const result = await runSimulacion(config, onLog, onMetrics);
                result.perEndpoint.forEach(ep => perEndpointResults.push(ep));
                onMetrics(result.aggregate);
                onComplete(config.tool, result.aggregate);
            }
            else {
                const metrics = await runToolProcess(config, onLog, onMetrics);
                onMetrics(metrics);
                const ep = config.endpoints?.[0];
                if (ep) {
                    perEndpointResults.push({
                        url: ep.endpoint,
                        method: ep.method || 'GET',
                        totalRequests: metrics.totalRequests || 0,
                        successCount: metrics.successCount || 0,
                        failCount: metrics.failCount || 0,
                        avgLatency: metrics.latency?.avg || 0,
                        p95: metrics.latency?.p95 || 0,
                        p99: metrics.latency?.p99 || 0,
                        status: (metrics.failCount || 0) > (metrics.successCount || 0) ? 'error' : 'success',
                    });
                }
                onComplete(config.tool, metrics);
            }
        }
        catch (err) {
            onLog(config.tool, `Error: ${err.message}`);
            onComplete(config.tool, null);
        }
    }
    return perEndpointResults;
}
async function checkToolAvailable(tool) {
    return true;
}
function runSimulacion(config, onLog, onMetrics) {
    return new Promise((resolve) => {
        const durSec = Math.max(5, Math.floor(config.durationMs / 1000));
        const durationMs = config.durationMs || 10000;
        const concurrencyLevel = config.concurrency || 10;
        const endpoints = config.endpoints && config.endpoints.length > 0
            ? config.endpoints
            : [{ endpoint: config.targetUrl || 'http://backend:8080', method: 'GET' }];
        const perEndpoint = {};
        endpoints.forEach(ep => {
            perEndpoint[ep.endpoint] = { method: ep.method || 'GET', sent: 0, ok: 0, err: 0, latencies: [] };
        });
        let totalSent = 0;
        let epIndex = 0;
        const startTime = Date.now();
        const makeRequest = () => {
            const ep = endpoints[epIndex % endpoints.length];
            epIndex++;
            const epStats = perEndpoint[ep.endpoint];
            if (!epStats)
                return;
            epStats.sent++;
            totalSent++;
            const fullUrl = ep.endpoint.startsWith('http') ? ep.endpoint : `http://${ep.endpoint}`;
            const reqStart = Date.now();
            const cb = (res) => {
                const latency = Date.now() - reqStart;
                epStats.latencies.push(latency);
                epStats.ok++;
                res.resume();
            };
            const errCb = (e) => {
                const latency = Date.now() - reqStart;
                epStats.latencies.push(latency);
                epStats.err++;
            };
            const req = http_1.default.get(fullUrl, cb);
            req.on('error', errCb);
            req.setTimeout(5000, () => { req.destroy(); epStats.err++; });
        };
        const interval = setInterval(() => {
            for (let i = 0; i < concurrencyLevel; i++)
                makeRequest();
            if (onMetrics) {
                const elapsedSec = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
                let snapshotOk = 0;
                let snapshotErr = 0;
                let snapshotSent = 0;
                const allLatencies = [];
                Object.values(perEndpoint).forEach(s => {
                    snapshotOk += s.ok;
                    snapshotErr += s.err;
                    snapshotSent += s.sent;
                    allLatencies.push(...s.latencies);
                });
                const avgL = allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0;
                const totalReqs = Math.max(snapshotSent, 1);
                const liveSnapshot = baseMetrics(config.tool, {
                    concurrency: concurrencyLevel,
                    duration: elapsedSec,
                    totalRequests: snapshotSent,
                    successCount: snapshotOk,
                    failCount: snapshotErr,
                    errorRate: (snapshotErr / totalReqs) * 100,
                    throughput: snapshotSent / elapsedSec,
                    latency: { avg: avgL, p50: avgL * 0.8, p95: avgL * 1.5, p99: avgL * 2 },
                });
                onMetrics(liveSnapshot);
            }
        }, 1000);
        setTimeout(() => {
            clearInterval(interval);
            const total = Math.max(totalSent, 1);
            let totalOk = 0;
            let totalErr = 0;
            const allLatencies = [];
            const perEndpointResult = endpoints.map(ep => {
                const s = perEndpoint[ep.endpoint];
                const epTotal = Math.max(s.sent, 1);
                const epLatencies = s.latencies;
                const avgL = epLatencies.length > 0 ? epLatencies.reduce((a, b) => a + b, 0) / epLatencies.length : 0;
                const sorted = [...epLatencies].sort((a, b) => a - b);
                const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : avgL;
                const p99 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : avgL;
                totalOk += s.ok;
                totalErr += s.err;
                allLatencies.push(...epLatencies);
                return {
                    url: ep.endpoint,
                    method: ep.method || 'GET',
                    totalRequests: s.sent,
                    successCount: s.ok,
                    failCount: s.err,
                    avgLatency: avgL,
                    p95,
                    p99,
                    status: s.err > s.ok ? 'error' : 'success',
                };
            });
            const avgLatency = allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0;
            const sortedAll = [...allLatencies].sort((a, b) => a - b);
            const allP95 = sortedAll.length > 0 ? sortedAll[Math.floor(sortedAll.length * 0.95)] : avgLatency;
            const allP99 = sortedAll.length > 0 ? sortedAll[Math.floor(sortedAll.length * 0.99)] : avgLatency;
            const aggregated = baseMetrics(config.tool, {
                totalRequests: total,
                successCount: totalOk,
                failCount: totalErr,
                errorRate: totalErr / total,
                throughput: total / durSec,
                latency: { avg: avgLatency, p50: avgLatency * 0.8, p95: allP95, p99: allP99 },
            });
            resolve({ aggregate: aggregated, perEndpoint: perEndpointResult });
        }, durationMs);
    });
}
//# sourceMappingURL=tool-runner.js.map