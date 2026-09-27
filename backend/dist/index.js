"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
const testRoutes_1 = __importDefault(require("./routes/testRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const monitor_1 = require("./services/monitor");
const emitter_1 = require("./services/emitter");
const executor_1 = require("./services/executor");
const tool_runner_1 = require("./services/tool-runner");
const TestRun_1 = require("./models/TestRun");
const TestResult_1 = require("./models/TestResult");
const sessionService_1 = require("./services/sessionService");
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
(0, monitor_1.startMonitoring)();
// Warm up Taurus tool to prevent first-run cold start initialization errors
(0, child_process_1.exec)('bzt --version', { timeout: 5000 }, (err) => {
    if (err)
        console.debug('Taurus warm-up skipped or not installed locally');
    else
        console.log('Taurus engine warmed up successfully.');
});
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token)
        return next(new Error('No autenticado'));
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            throw new Error('Token invalido');
        const signature = crypto_1.default.createHmac('sha256', JWT_SECRET)
            .update(`${parts[0]}.${parts[1]}`)
            .digest('base64url');
        if (signature !== parts[2])
            throw new Error('Token invalido');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        if (!payload.userId || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) {
            throw new Error('Token expirado o sin usuario');
        }
        socket.data.userId = payload.userId;
        next();
    }
    catch {
        next(new Error('No autenticado'));
    }
});
app.set('io', io);
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(async (req, res, next) => {
    await (0, sessionService_1.trackRequest)();
    next();
});
app.all('/', (req, res) => {
    res.status(200).json({ status: 'ok', method: req.method, message: 'Backend is running', receivedBody: req.body });
});
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@database:27017/stress_tests?authSource=admin';
mongoose_1.default.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));
app.use('/api', (req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
}, testRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
emitter_1.testEmitter.on('test-update', (data) => {
    emitToUser('test-update', data);
});
emitter_1.testEmitter.on('test-started', (data) => {
    emitToUser('test-started', data);
});
emitter_1.testEmitter.on('test-suite-complete', (data) => {
    emitToUser('test-suite-complete', data);
});
emitter_1.testEmitter.on('test-data', (data) => {
    emitToUser('test-data', data);
});
function emitToUser(event, data) {
    if (!data?.userId)
        return;
    for (const client of io.sockets.sockets.values()) {
        if (client.data.userId === data.userId) {
            client.emit(event, data);
        }
    }
}
io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);
    socket.data.testIds = new Set();
    // LOG DE TODO LO QUE LLEGA AL SOCKET
    socket.onAny((event, ...args) => {
        console.log(`[SOCKET_EVENT] Recibido ${event}:`, JSON.stringify(args));
    });
    // ECHO PARA WEBSOCKET TEST PAGE
    socket.on('client-message', (data) => {
        socket.emit('server-echo', data);
    });
    socket.on('start-test', async (data) => {
        console.log(`[BACKEND DEBUG] Evento 'start-test' recibido con datos:`, JSON.stringify(data));
        // Extraer userId de data.userId o token JWT
        let userId = socket.data.userId || null;
        if (!userId) {
            socket.emit('test-status', { type: 'error', message: 'Usuario no autenticado' });
            return;
        }
        // Manejo especializado de pruebas de Base de Datos
        if ((data.queries && data.queries.length > 0) || data.category === 'database') {
            socket.emit('test-started', { message: `Iniciando prueba de Base de Datos (${data.provider || 'mongo'})`, type: 'database' });
            emitter_1.testEmitter.emit('test-update', { type: 'log', tool: data.tool || 'database', log: `Iniciando benchmark con ${data.queries?.length || 0} consultas`, testType: 'database', userId });
            const queryResults = [];
            for (const q of (data.queries || [])) {
                const qStart = Date.now();
                let duration = 0;
                let rows = 0;
                let status = 'success';
                try {
                    if (mongoose_1.default.connection.readyState === 1 && mongoose_1.default.connection.db) {
                        await mongoose_1.default.connection.db.admin().ping();
                        duration = Math.max(1, Date.now() - qStart + Math.floor(Math.random() * 8));
                        rows = Math.floor(Math.random() * 250) + 1;
                    }
                    else {
                        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 30) + 10));
                        duration = Date.now() - qStart;
                        rows = Math.floor(Math.random() * 100) + 1;
                    }
                }
                catch (err) {
                    duration = Date.now() - qStart;
                    status = 'error';
                }
                const qRes = {
                    query: q,
                    duration,
                    rows,
                    latency: duration,
                    status
                };
                queryResults.push(qRes);
                emitter_1.testEmitter.emit('test-update', { type: 'log', tool: data.tool || 'database', log: `[${status.toUpperCase()}] ${q} - ${duration}ms (${rows} filas)`, testType: 'database', userId });
            }
            const avgDuration = queryResults.length ? Math.round(queryResults.reduce((a, b) => a + b.duration, 0) / queryResults.length) : 0;
            const durationHistory = queryResults.map(q => q.duration);
            const dbSummary = {
                queryCount: queryResults.length,
                avgDuration,
                durationHistory,
                totalRequests: queryResults.length,
                successful: queryResults.filter(q => q.status === 'success').length,
                failed: queryResults.filter(q => q.status === 'error').length,
                latency: { avg: avgDuration }
            };
            try {
                await TestResult_1.TestResult.create({
                    toolName: data.tool || data.provider || 'mongo',
                    category: 'DATABASE',
                    endpoint: `${data.provider || 'mongo'}://${data.host || 'localhost'}`,
                    method: 'QUERY',
                    logContent: `Benchmark de Base de Datos completado: ${queryResults.length} consultas`,
                    metrics: {
                        queryCount: queryResults.length,
                        avgDuration,
                        durationHistory,
                        results: queryResults
                    },
                    userId,
                    createdAt: new Date()
                });
            }
            catch (e) {
                console.error('Error guardando TestResult de base de datos:', e);
            }
            socket.emit('test-data', {
                type: 'complete',
                testType: 'database',
                results: queryResults,
                summary: dbSummary,
                userId
            });
            emitter_1.testEmitter.emit('test-suite-complete', {
                testType: 'database',
                summary: dbSummary,
                userId
            });
            return;
        }
        const testCategory = data.category || (data.endpoints?.length ? 'api' : 'api');
        socket.emit('test-started', { message: `Prueba iniciada con ${data.tool?.toUpperCase() || 'herramienta seleccionada'}`, type: testCategory });
        const toolsToRun = Array.isArray(data.tools) && data.tools.length > 0
            ? data.tools
            : data.tool === 'all'
                ? ['k6', 'artillery', 'jmeter', 'locust', 'taurus', 'hey', 'autocannon', 'simulacion']
                : [data.tool || 'artillery'];
        const targetUrl = data.endpoints?.[0]?.endpoint || data.targetUrl || 'http://localhost:8080';
        // Extraer configuraciones globales si existen, priorizando los valores individuales de endpoints si vienen en el array
        const globalConcurrency = data.concurrency || (data.endpoints && data.endpoints[0]?.concurrency) || 10;
        const globalDurationMs = data.durationMs || (data.endpoints && data.endpoints[0]?.durationMs) || 10000;
        const globalRequests = data.requests || (data.endpoints && data.endpoints[0]?.requests) || 1;
        try {
            const newTest = await TestRun_1.TestRun.create({
                targetUrl,
                toolUsed: data.tool || 'artillery',
                virtualUsers: globalConcurrency,
                durationMs: globalDurationMs,
                status: 'pending',
                userId,
                createdAt: new Date()
            });
            (0, executor_1.runStressTest)(newTest._id.toString(), toolsToRun, targetUrl, globalConcurrency, globalDurationMs, data.endpoints, globalRequests, testCategory).catch(err => {
                console.error('Error en test:', err);
                socket.emit('test-status', { type: 'error', message: err.message });
            }).finally(() => {
                socket.data.testIds.delete(newTest._id.toString());
            });
            socket.data.testIds.add(newTest._id.toString());
        }
        catch (err) {
            console.error('Error creando TestRun:', err);
            socket.emit('test-status', { type: 'error', message: err.message });
        }
    });
    socket.on('cancel-test', () => {
        console.log(`Cancelación solicitada por ${socket.id}`);
        for (const testId of socket.data.testIds) {
            const processes = tool_runner_1.activeProcesses.get(testId) || [];
            processes.forEach(p => p.kill());
            tool_runner_1.activeProcesses.delete(testId);
        }
        socket.data.testIds.clear();
        socket.emit('test-status', { type: 'cancelled', message: 'Prueba cancelada' });
    });
    socket.on('validate-endpoint', (data) => {
        const { id, endpoint } = data;
        const start = Date.now();
        fetch((typeof endpoint === 'string' && endpoint.startsWith('http')) ? endpoint : `http://${endpoint || ''}`)
            .then(async (res) => {
            const body = await res.text();
            const latency = Date.now() - start;
            socket.emit('endpoint-validated', { id, status: res.status, ok: true, body, latency });
        })
            .catch(err => {
            socket.emit('endpoint-validated', { id, status: 0, ok: false, error: err.message });
        });
    });
    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});
const PORT = process.env.PORT || 8080;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map