"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const testRoutes_1 = __importDefault(require("./routes/testRoutes"));
const tool_runner_1 = require("./services/tool-runner");
const TestResult_1 = require("./models/TestResult");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, { cors: { origin: "*" } });
io.on("connection", (socket) => {
    console.log(`[WS] Cliente conectado: ${socket.id}`);
    socket.on("disconnect", () => console.log(`[WS] Cliente desconectado: ${socket.id}`));
    socket.on('start-test', async (config) => {
        console.log("DEBUG: Iniciando prueba desde socket:", config);
        if (isTestRunning) {
            io.emit('test-suite-log', "[ERROR] Ya hay una prueba en ejecución.\n");
            return;
        }
        isTestRunning = true;
        io.emit('test-started', { message: `Iniciando prueba con ${config.tool}` });
        // Almacenamos el mapeo de herramientas a datos de endpoints (usando minúsculas)
        const endpointMap = {};
        const endpointData = config.endpoints && config.endpoints.length > 0
            ? { id: config.endpoints[0].id, url: config.endpoints[0].endpoint }
            : undefined;
        if (endpointData) {
            endpointMap[config.tool.toLowerCase()] = endpointData;
        }
        const child = (0, child_process_1.spawn)('sh', ['/tests/run-all-tests.sh', config.tool, endpointData?.url || '']);
        if (child && child.stdout) {
            child.stdout.on('data', (data) => {
                const log = data.toString();
                io.emit('test-suite-log', log);
                // Intentar detectar finalización en cada fragmento
                if (log.includes('TOOL_DONE:')) {
                    const toolName = log.split(':')[1].trim().toLowerCase();
                    const endpointDataForTool = endpointMap[toolName];
                    processToolResult(toolName, endpointDataForTool);
                }
            });
            child.stderr.on('data', (data) => {
                io.emit('test-suite-log', `ERROR: ${data.toString()}`);
            });
            child.on('close', async (code) => {
                isTestRunning = false;
                io.emit('test-suite-log', `\n--- Suite Finalizada con código ${code} ---\n`);
            });
        }
        else {
            console.error("[ERROR] No se pudo crear el proceso child");
            isTestRunning = false;
            io.emit('test-suite-log', "[ERROR] Fallo al iniciar proceso de prueba.\n");
        }
    });
});
const PORT = process.env.PORT || 8080;
app.use((0, cors_1.default)({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['*'], credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
let isTestRunning = false;
// --- Funciones auxiliares ---
function extractMetrics(log) {
    // Regexes más robustos para capturar el formato de K6
    const rpsMatch = log.match(/http_reqs\.*:\s+\d+\s+([\d.]+)\/s/);
    // Captura el valor numérico de la latencia ignorando la unidad (ms)
    const latencyMatch = log.match(/http_req_duration\.*:\s+avg=([\d.]+)/);
    // "iterations" suele ser el total de ejecuciones completadas
    const totalReqMatch = log.match(/iterations\.*:\s+(\d+)/);
    const failedReqMatch = log.match(/http_req_failed\.*:\s+([\d.]+)%\s+(\d+)\s+out of/);
    console.log("[DEBUG] Regex Metrics Extraction:", {
        rpsMatch: rpsMatch ? rpsMatch[1] : 'null',
        latencyMatch: latencyMatch ? latencyMatch[1] : 'null',
        totalReqMatch: totalReqMatch ? totalReqMatch[1] : 'null',
        failedReqMatch: failedReqMatch ? failedReqMatch[1] : 'null'
    });
    return {
        rps: rpsMatch ? parseFloat(rpsMatch[1]) : 0,
        // La latencia viene en ms, el regex captura el número
        latency: latencyMatch ? parseFloat(latencyMatch[1]) : 0,
        totalRequests: totalReqMatch ? parseInt(totalReqMatch[1]) : 0,
        errorRate: failedReqMatch ? parseFloat(failedReqMatch[1]) : 0,
        errors: failedReqMatch ? parseInt(failedReqMatch[2]) : 0,
    };
}
async function processToolResult(toolName, endpointData) {
    const logPath = `/app/backend/results/${toolName}.log`;
    if (!fs_1.default.existsSync(logPath)) {
        console.log(`[INFO] Log no encontrado para ${toolName}: ${logPath}`);
        return;
    }
    const logContent = fs_1.default.readFileSync(logPath, 'utf-8');
    const metrics = extractMetrics(logContent);
    const payload = {
        id: endpointData?.id || toolName,
        endpoint: endpointData?.url || `Tool: ${toolName.toUpperCase()}`,
        method: 'GET',
        status: metrics.errorRate === 0 ? 'success' : 'error',
        successCount: metrics.totalRequests - metrics.errors,
        failCount: metrics.errors,
        totalReqs: metrics.totalRequests,
        latency: { avg: metrics.latency },
        configSnapshot: { duration: 30 }
    };
    io.emit('test-endpoint-update', payload);
}
function generateExecutiveReport(tool, metrics) {
    const isFailed = metrics.errorRate > 0;
    return `
================================================================================
          INFORME EJECUTIVO: ${tool.toUpperCase()}
================================================================================
[ESTADO].............: ${isFailed ? '❌ FALLIDO' : '✅ EXITOSO'}
[TASA DE ERROR]......: ${metrics.errorRate.toFixed(2)}% (${metrics.errors || 0} errores)
[PETICIONES TOTALES].: ${metrics.totalRequests || 0}
[RPS PROMEDIO].......: ${typeof metrics.rps === 'number' ? metrics.rps.toFixed(2) : '0.00'} req/s
[LATENCIA PROMEDIO]..: ${typeof metrics.latency === 'number' ? metrics.latency.toFixed(2) : '0.00'} ms
--------------------------------------------------------------------------------
Resumen: ${isFailed ? 'Se detectaron fallos en la ejecución.' : 'Prueba ejecutada correctamente.'}
================================================================================
`;
}
// Ruta raíz necesaria para las pruebas de conectividad
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Backend OK' });
});
// Ruta de API específica
app.use('/api', testRoutes_1.default);
app.get('/api/status', async (_req, res) => {
    const ALL_TOOLS = ['k6', 'artillery', 'jmeter', 'locust', 'taurus', 'hey', 'bombardier', 'vegeta', 'gatling', 'autocannon', 'simulacion'];
    const availability = {};
    for (const tool of ALL_TOOLS) {
        availability[tool] = await (0, tool_runner_1.checkToolAvailable)(tool);
    }
    res.json({ status: 'online', tools: availability, uptime: process.uptime() });
});
app.post('/api/test-suite/run', (req, res) => {
    if (isTestRunning)
        return res.status(409).json({ error: 'Ya hay una suite en ejecución.' });
    isTestRunning = true;
    console.log("[DEBUG] Spawning: sh /tests/run-all-tests.sh");
    const child = (0, child_process_1.spawn)('sh', ['/tests/run-all-tests.sh', 'all']);
    if (child && child.stdout) {
        child.stdout.on('data', (data) => {
            const log = data.toString();
            console.log(`[DEBUG] Shell Output: ${log}`);
            io.emit('test-suite-log', log);
            // Verificamos si contiene la señal de finalización o mensajes de depuración
            if (log.includes('TOOL_DONE:')) {
                const toolName = log.split(':')[1].trim();
                processToolResult(toolName);
            }
        });
        child.stderr.on('data', (data) => {
            const log = data.toString();
            console.error(`[DEBUG] Shell Error: ${log}`);
            io.emit('test-suite-log', log);
        });
        child.on('error', (err) => {
            console.error(`[DEBUG] Error crítico en spawn: ${err.message}`);
            isTestRunning = false;
        });
        child.on('close', async (code) => {
            console.log(`[DEBUG] Proceso terminado con código: ${code}`);
            isTestRunning = false;
            io.emit('test-suite-log', `\n--- Suite Finalizada con código ${code} ---\n`);
            const resultsDir = '/app/backend/results';
            if (fs_1.default.existsSync(resultsDir)) {
                const files = fs_1.default.readdirSync(resultsDir);
                for (const file of files) {
                    const filePath = path_1.default.join(resultsDir, file);
                    const logContent = fs_1.default.readFileSync(filePath, 'utf-8');
                    const metrics = extractMetrics(logContent);
                    await TestResult_1.TestResult.create({ toolName: file.replace('.log', ''), logContent, metrics });
                    io.emit('test-suite-log', generateExecutiveReport(file.replace('.log', ''), metrics));
                    processToolResult(file.replace('.log', ''));
                }
            }
        });
    }
    else {
        console.error("[ERROR] No se pudo crear el proceso child");
        isTestRunning = false;
        return res.status(500).json({ error: "No se pudo iniciar el proceso." });
    }
    res.json({ message: 'Suite iniciada.' });
});
// --- Inicialización ---
// Triggering re-compile
mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://admin:password123@127.0.0.1:27017/stress_tests?authSource=admin')
    .then(() => console.log('✅ [Mongoose] Conectado a MongoDB.'))
    .catch((err) => console.error('❌ Error MongoDB:', err.message));
httpServer.listen(Number(PORT), '0.0.0.0', () => console.log(`🚀 StressForge Backend corriendo en puerto ${PORT}`));
//# sourceMappingURL=index.js.map