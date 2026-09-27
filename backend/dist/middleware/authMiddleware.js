"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const crypto_1 = __importDefault(require("crypto"));
const sessionService_1 = require("../services/sessionService");
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'No token' });
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            throw new Error('Invalid token');
        const signature = crypto_1.default.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
        if (signature !== parts[2])
            throw new Error('Invalid signature');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000))
            throw new Error('Token expired');
        req.user = payload;
        // Track active user
        await (0, sessionService_1.trackActiveUser)(payload.userId);
        next();
    }
    catch {
        res.status(401).json({ error: 'Token invalido' });
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return next();
    try {
        const parts = token.split('.');
        if (parts.length === 3) {
            const signature = crypto_1.default.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
            if (signature === parts[2]) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
                if (!payload.exp || payload.exp >= Math.floor(Date.now() / 1000)) {
                    req.user = payload;
                    await (0, sessionService_1.trackActiveUser)(payload.userId);
                }
            }
        }
    }
    catch { }
    next();
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=authMiddleware.js.map