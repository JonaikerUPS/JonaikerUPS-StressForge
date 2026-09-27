"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestsPerMinute = exports.trackRequest = exports.getActiveUsersCount = exports.getUserLoginTime = exports.trackActiveUser = void 0;
const redisService_1 = __importDefault(require("./redisService"));
const ACTIVE_USERS_KEY = 'active_users';
const SESSION_TTL = 86400; // 24 horas en segundos
const trackActiveUser = async (userId) => {
    // Añade al conjunto y refresca el TTL
    await redisService_1.default.sAdd(ACTIVE_USERS_KEY, userId);
    await redisService_1.default.expire(ACTIVE_USERS_KEY, SESSION_TTL);
    // Store/Update login time if not set
    const loginTimeKey = `user:${userId}:loginTime`;
    const exists = await redisService_1.default.exists(loginTimeKey);
    if (!exists) {
        await redisService_1.default.set(loginTimeKey, Date.now().toString(), { EX: SESSION_TTL });
    }
    else {
        await redisService_1.default.expire(loginTimeKey, SESSION_TTL);
    }
};
exports.trackActiveUser = trackActiveUser;
const getUserLoginTime = async (userId) => {
    const loginTime = await redisService_1.default.get(`user:${userId}:loginTime`);
    return loginTime ? parseInt(loginTime) : null;
};
exports.getUserLoginTime = getUserLoginTime;
const getActiveUsersCount = async () => {
    return await redisService_1.default.sCard(ACTIVE_USERS_KEY);
};
exports.getActiveUsersCount = getActiveUsersCount;
const trackRequest = async () => {
    const minute = Math.floor(Date.now() / 60000);
    const key = `requests:minute:${minute}`;
    await redisService_1.default.incr(key);
    await redisService_1.default.expire(key, 60); // Expira en 1 minuto
};
exports.trackRequest = trackRequest;
const getRequestsPerMinute = async () => {
    const minute = Math.floor(Date.now() / 60000);
    const key = `requests:minute:${minute}`;
    const count = await redisService_1.default.get(key);
    return count ? parseInt(count) : 0;
};
exports.getRequestsPerMinute = getRequestsPerMinute;
//# sourceMappingURL=sessionService.js.map