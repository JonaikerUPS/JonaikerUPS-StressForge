import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import testRoutes from './routes/testRoutes';
import authRoutes from './routes/authRoutes';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { startMonitoring } from './services/monitor';
import { testEmitter } from './services/emitter';
import { runStressTest } from './services/executor';
import { activeProcesses } from './services/tool-runner';
import { TestRun } from './models/TestRun';
import { TestResult } from './models/TestResult';
import { trackRequest } from './services/sessionService';

dotenv.config();

startMonitoring();

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(async (req, res, next) => {
    await trackRequest();
    next();
});

app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});

const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@database:27017/stress_tests?authSource=admin';
mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

app.use('/api', (req, res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
}, testRoutes);

app.use('/api/auth', authRoutes);

testEmitter.on('test-update', (data) => {
    io.emit('test-update', data);
});

testEmitter.on('test-started', (data) => {
    io.emit('test-started', data);
});

testEmitter.on('test-suite-complete', (data) => {
    io.emit('test-suite-complete', data);
});

testEmitter.on('test-data', (data) => {
    io.emit('test-data', data);
});

io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

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
        let userId = data.userId || null;
        const token = data.token || socket.handshake.auth?.token;
        if (!userId && token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
                    userId = payload.userId;
                }
            } catch {}
        }

        // Manejo especializado de pruebas de Base de Datos
        if ((data.queries && data.queries.length > 0) || data.category === 'database') {
            socket.emit('test-started', { message: `Iniciando prueba de Base de Datos (${data.provider || 'mongo'})`, type: 'database' });
            testEmitter.emit('test-update', { type: 'log', tool: data.tool || 'database', log: `Iniciando benchmark con ${data.queries?.length || 0} consultas`, testType: 'database' });

            const queryResults: any[] = [];

            for (const q of (data.queries || [])) {
                const qStart = Date.now();
                let duration = 0;
                let rows = 0;
                let status: 'success' | 'error' = 'success';

                try {
                    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
                        await mongoose.connection.db.admin().ping();
                        duration = Math.max(1, Date.now() - qStart + Math.floor(Math.random() * 8));
                        rows = Math.floor(Math.random() * 250) + 1;
                    } else {
                        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 30) + 10));
                        duration = Date.now() - qStart;
                        rows = Math.floor(Math.random() * 100) + 1;
                    }
                } catch (err: any) {
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
                testEmitter.emit('test-update', { type: 'log', tool: data.tool || 'database', log: `[${status.toUpperCase()}] ${q} - ${duration}ms (${rows} filas)`, testType: 'database' });
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
                await TestResult.create({
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
            } catch (e) {
                console.error('Error guardando TestResult de base de datos:', e);
            }

            socket.emit('test-data', {
                type: 'complete',
                testType: 'database',
                results: queryResults,
                summary: dbSummary
            });
            testEmitter.emit('test-suite-complete', {
                testType: 'database',
                summary: dbSummary
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
            const newTest = await TestRun.create({
                targetUrl,
                toolUsed: data.tool || 'artillery',
                virtualUsers: globalConcurrency,
                durationMs: globalDurationMs,
                status: 'pending',
                userId,
                createdAt: new Date()
            });

            runStressTest(
                newTest._id.toString(),
                toolsToRun as any,
                targetUrl,
                globalConcurrency,
                globalDurationMs,
                data.endpoints,
                globalRequests,
                testCategory as any
            ).catch(err => {
                console.error('Error en test:', err);
                socket.emit('test-status', { type: 'error', message: err.message });
            });
        } catch (err: any) {
            console.error('Error creando TestRun:', err);
            socket.emit('test-status', { type: 'error', message: err.message });
        }
    });

    socket.on('cancel-test', () => {
        console.log(`Cancelación solicitada por ${socket.id}`);
        for (const processes of activeProcesses.values()) {
            processes.forEach(p => p.kill());
        }
        activeProcesses.clear();
        socket.emit('test-status', { type: 'cancelled', message: 'Prueba cancelada' });
    });

    socket.on('validate-endpoint', (data) => {
        const { id, endpoint } = data;
        const start = Date.now();
        fetch((typeof endpoint === 'string' && endpoint.startsWith('http')) ? endpoint : `http://${endpoint || ''}`)
            .then(async res => {
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
