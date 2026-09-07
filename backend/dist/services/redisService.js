"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const client = (0, redis_1.createClient)({
    url: 'redis://redis:6379'
});
client.on('error', (err) => console.error('Redis Client Error', err));
// Conectar al iniciar
client.connect().then(() => console.log('Redis connected')).catch(console.error);
exports.default = client;
//# sourceMappingURL=redisService.js.map