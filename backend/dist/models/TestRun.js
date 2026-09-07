"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRun = void 0;
const mongoose_1 = require("mongoose");
const testRunSchema = new mongoose_1.Schema({
    targetUrl: { type: String, required: true },
    toolUsed: { type: String, required: true },
    virtualUsers: { type: Number, default: 10 },
    durationMs: { type: Number },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending',
    },
    results: { type: String },
    summary: {
        type: mongoose_1.Schema.Types.Mixed,
        default: undefined,
    },
    rawOutput: { type: String },
    createdAt: { type: Date, default: Date.now },
});
// Índice TTL: Los documentos se borran automáticamente tras 30 días
testRunSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
exports.TestRun = (0, mongoose_1.model)('TestRun', testRunSchema);
//# sourceMappingURL=TestRun.js.map