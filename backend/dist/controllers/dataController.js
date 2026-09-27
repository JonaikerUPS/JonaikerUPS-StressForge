"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUserData = void 0;
const TestRun_1 = require("../models/TestRun");
const TestResult_1 = require("../models/TestResult");
const clearUserData = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (userId) {
            await TestRun_1.TestRun.deleteMany({ userId });
            await TestResult_1.TestResult.deleteMany({ userId });
        }
        await TestRun_1.TestRun.deleteMany({});
        await TestResult_1.TestResult.deleteMany({});
        res.status(200).json({ message: 'Historial, pruebas y datos de IA eliminados correctamente' });
    }
    catch (error) {
        res.status(500).json({ error: 'Error al limpiar datos' });
    }
};
exports.clearUserData = clearUserData;
//# sourceMappingURL=dataController.js.map