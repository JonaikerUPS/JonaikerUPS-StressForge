import { Router } from 'express';
import { launchTest, getTestsHistory, getResultsHistory, getLatestEndpointResults, saveTestResult, checkCache, invalidateCache, pingServer, getStatus, scanPorts, deleteResultsByCategory } from '../controllers/testController';
import { getActiveUsersCount, getRequestsPerMinute, getUserLoginTime } from '../services/sessionService';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';
import { clearUserData } from '../controllers/dataController';
import { getLatestSample } from '../services/monitor';

const router = Router();

// Definimos los endpoints que consumirá tu Next.js
router.post('/tests/launch', authenticate, launchTest);
router.post('/tests/results', optionalAuthenticate, saveTestResult);
router.get('/tests', authenticate, getTestsHistory);
router.get('/tests/results', authenticate, getResultsHistory);
router.get('/tests/results/latest', optionalAuthenticate, getLatestEndpointResults);
router.delete('/tests/results/:category', authenticate, deleteResultsByCategory);
router.get('/cache/check', checkCache);
router.delete('/cache/invalidate/:key', invalidateCache);
router.get('/network/ping', pingServer);
router.get('/network/scan-ports', optionalAuthenticate, scanPorts);
router.delete('/tests/clear', authenticate, clearUserData);

// Re-trigger compilation
router.get('/system/stats', authenticate, async (req, res) => {
    const activeUsers = await getActiveUsersCount();
    const reqPerMinute = await getRequestsPerMinute();
    const userId = (req as any).user.userId;
    const loginTime = await getUserLoginTime(userId);
    res.json({ activeUsers, reqPerMinute, loginTime });
});

router.get('/system/resources', (req, res) => {
    const latest = getLatestSample();
    res.json({
        cpuCount: latest.cpuUsage,
        ram: {
            usedGB: latest.usedRamGB,
            totalGB: latest.totalRamGB
        }
    });
});
router.get('/status', getStatus);
router.get('/tools', getStatus);

export default router;
