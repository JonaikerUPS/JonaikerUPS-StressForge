"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestResult = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const TestResultSchema = new mongoose_1.default.Schema({
    toolName: { type: String, required: true },
    logContent: { type: String, required: true },
    metrics: {
        rps: Number,
        latency: Number,
        errors: Number,
    },
    createdAt: { type: Date, default: Date.now }
});
exports.TestResult = mongoose_1.default.model('TestResult', TestResultSchema);
//# sourceMappingURL=TestResult.js.map