"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testController_1 = require("../controllers/testController");
const sessionService_1 = require("../services/sessionService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const dataController_1 = require("../controllers/dataController");
const monitor_1 = require("../services/monitor");
const router = (0, express_1.Router)();
// Definimos los endpoints que consumirá tu Next.js
router.post('/tests/launch', authMiddleware_1.authenticate, testController_1.launchTest);
router.post('/tests/results', authMiddleware_1.optionalAuthenticate, testController_1.saveTestResult);
router.get('/tests', authMiddleware_1.authenticate, testController_1.getTestsHistory);
router.get('/tests/results', authMiddleware_1.authenticate, testController_1.getResultsHistory);
router.get('/tests/results/latest', authMiddleware_1.optionalAuthenticate, testController_1.getLatestEndpointResults);
router.delete('/tests/results/:category', authMiddleware_1.authenticate, testController_1.deleteResultsByCategory);
router.get('/cache/check', testController_1.checkCache);
router.delete('/cache/invalidate/:key', testController_1.invalidateCache);
router.get('/network/ping', testController_1.pingServer);
router.get('/network/scan-ports', authMiddleware_1.optionalAuthenticate, testController_1.scanPorts);
router.delete('/tests/clear', authMiddleware_1.authenticate, dataController_1.clearUserData);
// Re-trigger compilation
router.get('/system/stats', authMiddleware_1.authenticate, async (req, res) => {
    const activeUsers = await (0, sessionService_1.getActiveUsersCount)();
    const reqPerMinute = await (0, sessionService_1.getRequestsPerMinute)();
    const userId = req.user.userId;
    const loginTime = await (0, sessionService_1.getUserLoginTime)(userId);
    res.json({ activeUsers, reqPerMinute, loginTime });
});
router.get('/system/resources', (req, res) => {
    const latest = (0, monitor_1.getLatestSample)();
    res.json({
        cpuCount: latest.cpuUsage,
        ram: {
            usedGB: latest.usedRamGB,
            totalGB: latest.totalRamGB
        }
    });
});
router.get('/status', testController_1.getStatus);
router.get('/tools', testController_1.getStatus);
exports.default = router;
//# sourceMappingURL=testRoutes.js.map