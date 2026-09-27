"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteResultsByCategory = exports.scanPorts = exports.pingServer = exports.invalidateCache = exports.checkCache = exports.getLatestEndpointResults = exports.getResultsHistory = exports.getTestsHistory = exports.saveTestResult = exports.launchTest = exports.getStatus = void 0;
const TestRun_1 = require("../models/TestRun");
const TestResult_1 = require("../models/TestResult");
const executor_1 = require("../services/executor");
const redisService_1 = __importDefault(require("../services/redisService"));
const metrics_1 = require("../metrics");
const child_process_1 = require("child_process");
// 6. Estado del servidor y herramientas disponibles
const getStatus = async (_req, res) => {
    try {
        const toolCommands = {
            k6: 'k6',
            artillery: 'npx',
            autocannon: 'npx',
            hey: 'hey',
            bombardier: 'bombardier',
            vegeta: 'vegeta',
            locust: 'locust',
            taurus: 'bzt',
            jmeter: 'jmeter',
            gatling: 'gatling',
            nmap: 'nmap',
            masscan: 'masscan',
            nikto: 'nikto',
            hydra: 'hydra',
            sqlmap: 'sqlmap',
            gobuster: 'gobuster',
            wfuzz: 'wfuzz',
            ffuf: 'ffuf',
            hping3: 'hping3',
            siege: 'siege',
            ab: 'ab',
            slowloris: 'slowloris'
        };
        const toolsStatus = {};
        for (const tool of Object.keys(metrics_1.Parsers)) {
            if (tool === 'simulacion') {
                toolsStatus[tool] = true;
                continue;
            }
            try {
                const cmd = toolCommands[tool] || tool;
                // Usamos 'command -v' en lugar de 'which' para una comprobación más portable en entornos POSIX
                (0, child_process_1.execSync)(`command -v ${cmd}`);
                toolsStatus[tool] = true;
            }
            catch {
                toolsStatus[tool] = false;
            }
        }
        res.status(200).json({
            status: 'ok',
            tools: toolsStatus
        });
    }
    catch (error) {
        console.error("Error in getStatus:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStatus = getStatus;
const launchTest = async (req, res) => {
    console.log("DEBUG: launchTest received request body:", JSON.stringify(req.body));
    try {
        const { targetUrl, toolUsed, virtualUsers, isCustomYaml, customYaml, body } = req.body;
        const { userId } = req.user;
        // Si toolUsed es "all", convertimos a la lista completa
        const toolsToRun = toolUsed === 'all'
            ? ['k6', 'artillery', 'jmeter', 'locust', 'taurus', 'hey', 'autocannon', 'simulacion']
            : [toolUsed];
        const newTest = await TestRun_1.TestRun.create({
            targetUrl,
            toolUsed,
            virtualUsers,
            userId,
            status: 'pending',
            createdAt: new Date()
        });
        (0, executor_1.runStressTest)(newTest._id.toString(), toolsToRun, targetUrl, virtualUsers || 10, req.body.durationMs || 10000, req.body.endpoints, req.body.requests, req.body.category || 'stress', isCustomYaml, customYaml || body);
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
// 2. Guardar resultado manual o de módulo en MongoDB
const saveTestResult = async (req, res) => {
    try {
        const { userId } = req.user || {};
        const { toolName, category, endpoint, method, logContent, metrics } = req.body;
        const result = await TestResult_1.TestResult.create({
            toolName: toolName || category?.toLowerCase() || 'system',
            category: (category || 'API').toUpperCase(),
            endpoint: endpoint || '',
            method: method || 'GET',
            logContent: logContent || `Test for ${category} completed`,
            metrics: metrics || {},
            userId: userId || null,
            createdAt: new Date(),
        });
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al guardar resultado en DB', details: error.message });
    }
};
exports.saveTestResult = saveTestResult;
// 2.1 Obtener el historial completo de pruebas (TestRuns)
const getTestsHistory = async (req, res) => {
    try {
        const { userId } = req.user || {};
        if (!userId) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }
        const query = { userId };
        const tests = await TestRun_1.TestRun.find(query).sort({ createdAt: -1 });
        res.status(200).json(tests);
    }
    catch (error) {
        res.status(500).json({ error: 'No se pudo obtener el historial de la DB.', details: error.message });
    }
};
exports.getTestsHistory = getTestsHistory;
// 2.2 Obtener el historial de resultados (TestResults)
const getResultsHistory = async (req, res) => {
    try {
        const { userId } = req.user || {};
        if (!userId) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }
        const query = { userId };
        const results = await TestResult_1.TestResult.find(query).sort({ createdAt: -1 });
        res.status(200).json(results);
    }
    catch (error) {
        res.status(500).json({ error: 'No se pudo obtener el historial de resultados.', details: error.message });
    }
};
exports.getResultsHistory = getResultsHistory;
// 2.3 Obtener los últimos resultados con datos de endpoints
const getLatestEndpointResults = async (req, res) => {
    try {
        const { userId } = req.user || {};
        if (!userId) {
            res.status(401).json({ error: 'Usuario no autenticado' });
            return;
        }
        const query = { userId };
        const results = await TestResult_1.TestResult.find(query)
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json(results);
    }
    catch (error) {
        res.status(500).json({ error: 'No se pudo obtener los resultados.', details: error.message });
    }
};
exports.getLatestEndpointResults = getLatestEndpointResults;
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
const networkService_1 = require("../services/networkService");
// 5. Prueba de red REAL (Ping Avanzado)
const pingServer = async (req, res) => {
    try {
        const target = req.query.target;
        const packets = parseInt(req.query.packets) || 4;
        if (!target) {
            res.status(400).json({ error: 'Target host is required' });
            return;
        }
        const result = await (0, networkService_1.performAdvancedPing)(target, packets);
        res.status(200).json({
            server: target,
            latency: result.latency,
            packetLoss: result.packetLoss,
            jitter: result.jitter,
            status: result.success ? "success" : (result.packetLoss < 50 ? "warning" : "error")
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al realizar ping', details: error.message });
    }
};
exports.pingServer = pingServer;
// 6. Escaneo de puertos
const scanPorts = async (req, res) => {
    try {
        const target = req.query.target || 'localhost';
        const results = await (0, networkService_1.performNmapScan)(target);
        res.status(200).json({ target, results });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al escanear puertos', details: error.message });
    }
};
exports.scanPorts = scanPorts;
// 7. Borrado específico por categoría
const deleteResultsByCategory = async (req, res) => {
    try {
        const { userId } = req.user;
        const category = String(req.params.category).toUpperCase();
        await TestResult_1.TestResult.deleteMany({ userId, category: category === 'API' ? { $in: ['API', 'STRESS'] } : category });
        res.status(200).json({ message: `Datos de ${category} borrados correctamente` });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al limpiar datos por categoría', details: error.message });
    }
};
exports.deleteResultsByCategory = deleteResultsByCategory;
//# sourceMappingURL=testController.js.map