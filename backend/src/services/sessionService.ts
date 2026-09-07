import redisClient from './redisService';

const ACTIVE_USERS_KEY = 'active_users';
const SESSION_TTL = 86400; // 24 horas en segundos

export const trackActiveUser = async (userId: string) => {
    // Añade al conjunto y refresca el TTL
    await redisClient.sAdd(ACTIVE_USERS_KEY, userId);
    await redisClient.expire(ACTIVE_USERS_KEY, SESSION_TTL);
    
    // Store/Update login time if not set
    const loginTimeKey = `user:${userId}:loginTime`;
    const exists = await redisClient.exists(loginTimeKey);
    if (!exists) {
        await redisClient.set(loginTimeKey, Date.now().toString(), { EX: SESSION_TTL });
    } else {
        await redisClient.expire(loginTimeKey, SESSION_TTL);
    }
};

export const getUserLoginTime = async (userId: string) => {
    const loginTime = await redisClient.get(`user:${userId}:loginTime`);
    return loginTime ? parseInt(loginTime) : null;
};

export const getActiveUsersCount = async () => {
    return await redisClient.sCard(ACTIVE_USERS_KEY);
};

export const trackRequest = async () => {
    const minute = Math.floor(Date.now() / 60000);
    const key = `requests:minute:${minute}`;
    await redisClient.incr(key);
    await redisClient.expire(key, 60); // Expira en 1 minuto
};

export const getRequestsPerMinute = async () => {
    const minute = Math.floor(Date.now() / 60000);
    const key = `requests:minute:${minute}`;
    const count = await redisClient.get(key);
    return count ? parseInt(count) : 0;
};
