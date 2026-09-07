"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testController_1 = require("../controllers/testController");
const router = (0, express_1.Router)();
// Definimos los endpoints que consumirá tu Next.js
router.post('/tests/launch', testController_1.launchTest);
router.get('/tests', testController_1.getTestsHistory);
router.get('/cache/check', testController_1.checkCache);
router.delete('/cache/invalidate/:key', testController_1.invalidateCache);
router.get('/network/ping', testController_1.pingServer);
exports.default = router;
//# sourceMappingURL=testRoutes.js.map