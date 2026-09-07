"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
const ping = async (host) => {
    try {
        // Ejecuta ping con 1 paquete (-c 1). 
        // Nota: esto funciona en entornos Linux (contenedores Docker).
        const { stdout } = await execPromise(`ping -c 1 ${host}`);
        // Extrae el tiempo de respuesta usando una expresión regular básica
        const match = stdout.match(/time=([\d.]+)/);
        const latency = match ? parseFloat(match[1]) : 0;
        return { success: true, latency };
    }
    catch (e) {
        return { success: false, latency: 0 };
    }
};
exports.ping = ping;
//# sourceMappingURL=networkService.js.map