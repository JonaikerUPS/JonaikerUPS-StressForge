const http = require('http');

const [,, targetUrl, concurrency, durationMs] = process.argv;
const duration = parseInt(durationMs);
const concurrencyLevel = parseInt(concurrency);
const startTime = Date.now();

console.log(`[SIMULACION] Iniciando prueba contra ${targetUrl} con ${concurrencyLevel} usuarios por ${duration}ms`);

const makeRequest = () => {
    http.get(targetUrl, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
            console.log(`[SIMULACION] Request completada - Status: ${res.statusCode}`);
        });
    }).on('error', (e) => {
        console.error(`[SIMULACION] Error: ${e.message}`);
    });
};

const interval = setInterval(() => {
    for (let i = 0; i < concurrencyLevel; i++) {
        makeRequest();
    }
}, 1000);

setTimeout(() => {
    clearInterval(interval);
    console.log(`[SIMULACION] Prueba finalizada.`);
    process.exit(0);
}, duration);
