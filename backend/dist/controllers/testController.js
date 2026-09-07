"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingServer = exports.invalidateCache = exports.checkCache = exports.getTestsHistory = exports.launchTest = void 0;
const TestRun_1 = require("../models/TestRun");
const executor_1 = require("../services/executor");
const redisService_1 = __importDefault(require("../services/redisService"));
const networkService_1 = require("../services/networkService");
// 1. Lanzar una nueva prueba de estrés
const launchTest = async (req, res) => {
    try {
        const { targetUrl, toolUsed, virtualUsers } = req.body;
        // Si toolUsed es "all", convertimos a la lista completa
        const toolsToRun = toolUsed === 'all'
            ? ['k6', 'artillery', 'jmeter', 'locust', 'taurus', 'hey', 'autocannon', 'simulacion']
            : [toolUsed];
        const newTest = await TestRun_1.TestRun.create({
            targetUrl,
            toolUsed,
            virtualUsers,
            status: 'pending',
            createdAt: new Date()
        });
        (0, executor_1.runStressTest)(newTest._id.toString(), toolsToRun);
        res.status(201).json({
            message: 'Prueba de estrés aceptada y encolada en paralelo.',
            testId: newTest._id,
            currentStatus: newTest.status
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error interno del servidor al procesar la prueba.',
            details: error.message
        });
    }
};
exports.launchTest = launchTest;
// 2. Obtener el historial completo ordenado por la más reciente
const getTestsHistory = async (_req, res) => {
    try {
        const tests = await TestRun_1.TestRun.find().sort({ createdAt: -1 });
        res.status(200).json(tests);
    }
    catch (error) {
        res.status(500).json({ error: 'No se pudo obtener el historial de la DB.', details: error.message });
    }
};
exports.getTestsHistory = getTestsHistory;
// 3. Verificación de caché REAL con Redis
const checkCache = async (req, res) => {
    try {
        const key = req.query.key;
        // Intentar obtener de Redis
        const cachedValue = await redisService_1.default.get(key);
        if (cachedValue) {
            // HIT: Se encontró en caché
            res.status(200).json({ key, cached: true, duration: 5 });
        }
        else {
            // MISS: No se encontró, simulamos guardarlo
            await redisService_1.default.set(key, "data", { EX: 60 }); // Cache por 60s
            res.status(200).json({ key, cached: false, duration: 100 });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Error al consultar caché', details: error.message });
    }
};
exports.checkCache = checkCache;
// 4. Invalidación de caché
const invalidateCache = async (req, res) => {
    try {
        const key = req.params.key;
        if (!key) {
            res.status(400).json({ error: 'Key is required' });
            return;
        }
        await redisService_1.default.del(key);
        res.status(200).json({ message: `Cache for key ${key} invalidated` });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al invalidar caché', details: error.message });
    }
};
exports.invalidateCache = invalidateCache;
// 5. Prueba de red REAL (Ping)
const pingServer = async (req, res) => {
    try {
        const target = req.query.target;
        if (!target) {
            res.status(400).json({ error: 'Target host is required' });
            return;
        }
        const result = await (0, networkService_1.ping)(target);
        res.status(200).json({
            server: target,
            latency: result.latency,
            packetLoss: result.success ? 0 : 100,
            status: result.success ? "success" : "error"
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al realizar ping', details: error.message });
    }
};
exports.pingServer = pingServer;
//# sourceMappingURL=testController.js.map