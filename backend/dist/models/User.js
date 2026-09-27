"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true }, // UUID v4
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    passwordHash: { type: String }, // Opcional para Google Auth
    googleId: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
});
exports.User = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=User.js.map