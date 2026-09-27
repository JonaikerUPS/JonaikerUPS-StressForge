"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSlowloris = exports.parseAb = exports.parseSiege = exports.parseHping3 = exports.parseFfuf = exports.parseWfuzz = exports.parseGobuster = exports.parseSqlmap = exports.parseHydra = exports.parseNikto = exports.parseMasscan = exports.parseNmap = void 0;
function base() {
    return { rps: 0, latency: { avg: 0 }, totalRequests: 0, successCount: 0, failCount: 0, errorRate: 0 };
}
// nmap: "Nmap scan report for X", "22/tcp open ssh", "Nmap done: N IP address"
const parseNmap = (log) => {
    const m = base();
    const ports = log.match(/(\d+)\/(tcp|udp)\s+open/g) || [];
    const hosts = log.match(/Nmap scan report for/g) || [];
    const done = log.match(/Nmap done:\s+(\d+)/i);
    m.totalRequests = ports.length;
    m.successCount = ports.length;
    m.failCount = 0;
    m.rps = done ? parseInt(done[1]) : hosts.length;
    m.rawOutput = log;
    return m;
};
exports.parseNmap = parseNmap;
// masscan: "Discovered open port 22/tcp on X"
const parseMasscan = (log) => {
    const m = base();
    const ports = log.match(/Discovered open port\s+(\d+)\/(tcp|udp)/g) || [];
    m.totalRequests = ports.length;
    m.successCount = ports.length;
    m.failCount = 0;
    m.rps = ports.length;
    m.rawOutput = log;
    return m;
};
exports.parseMasscan = parseMasscan;
// nikto: "OSVDB-..." o líneas de vulnerabilidad, "+ ... : ..."
const parseNikto = (log) => {
    const m = base();
    const findings = log.match(/(OSVDB-\d+|\+.*:\s)/g) || [];
    const done = log.match(/^\+ .*:/m);
    m.totalRequests = findings.length;
    m.successCount = done ? findings.length : 0;
    m.failCount = done ? 0 : findings.length;
    m.rps = findings.length;
    m.rawOutput = log;
    return m;
};
exports.parseNikto = parseNikto;
// hydra: "[80][http-get] host:port login:admin password:admin123"
const parseHydra = (log) => {
    const m = base();
    const logins = log.match(/\[(?:http|https|ssh|ftp|rdp|mysql|postgres|smb)[^\]]*\].*login:/gi) || [];
    const total = log.match(/hydra|starting|DONE/g) || [];
    m.totalRequests = logins.length || total.length;
    m.successCount = logins.length;
    m.failCount = Math.max(0, m.totalRequests - m.successCount);
    m.rps = logins.length;
    m.rawOutput = log;
    return m;
};
exports.parseHydra = parseHydra;
// sqlmap: detecta vulnerabilidades, puntos de inyección o payloads
const parseSqlmap = (log) => {
    const m = base();
    // Patrones que indican un hallazgo real
    const findings = log.match(/(is vulnerable|injection point|payload|\[\+\])/gi) || [];
    // Patrones que indican errores o problemas
    const errors = log.match(/(\[ERROR\]|\[CRITICAL\])/gi) || [];
    m.totalRequests = findings.length + errors.length > 0 ? findings.length + errors.length : (log.includes('sqlmap') ? 1 : 0);
    m.successCount = findings.length;
    m.failCount = errors.length;
    m.rps = findings.length + errors.length;
    m.rawOutput = log;
    return m;
};
exports.parseSqlmap = parseSqlmap;
// gobuster: "Found: /admin (Status: 200)"
const parseGobuster = (log) => {
    const m = base();
    const found = log.match(/Found:\s+.+\(Status:\s+\d+\)/g) || [];
    const lines = log.split('\n').filter(l => l.trim().length > 0);
    m.totalRequests = found.length || lines.length;
    m.successCount = found.length;
    m.failCount = Math.max(0, m.totalRequests - m.successCount);
    m.rps = found.length;
    m.rawOutput = log;
    return m;
};
exports.parseGobuster = parseGobuster;
// wfuzz: líneas con códigos HTTP tipo "000000001  200 ..."
const parseWfuzz = (log) => {
    const m = base();
    const codes = log.match(/^\d+\s+\d{3}\s+\d+\s+\d+\s+\S+\s+.*$/gm) || [];
    const errors = log.match(/Finishing|Total requests/g) || [];
    m.totalRequests = codes.length || errors.length;
    m.successCount = codes.length;
    m.failCount = Math.max(0, m.totalRequests - m.successCount);
    m.rps = codes.length;
    m.rawOutput = log;
    return m;
};
exports.parseWfuzz = parseWfuzz;
// ffuf: ":: Progress: [N/..]" o líneas de resultados
const parseFfuf = (log) => {
    const m = base();
    const results = log.match(/Status:\s+\d{3}/g) || [];
    const progress = log.match(/Progress:\s+\[(\d+)\/(\d+)\]/g) || [];
    m.totalRequests = progress.length || results.length;
    m.successCount = results.length;
    m.failCount = Math.max(0, m.totalRequests - m.successCount);
    m.rps = results.length;
    m.rawOutput = log;
    return m;
};
exports.parseFfuf = parseFfuf;
// hping3: paquetes enviados "N packets transmitted" / "sent"
const parseHping3 = (log) => {
    const m = base();
    const sent = log.match(/(\d+)\s+packets?\s+transmitted/gi) || [];
    const received = log.match(/(\d+)\s+packets?\s+received/gi) || [];
    const total = sent.length ? parseInt((sent[0].match(/\d+/) || ['0'])[0]) : (log.split('\n').length);
    const recv = received.length ? parseInt((received[0].match(/\d+/) || ['0'])[0]) : 0;
    m.totalRequests = total;
    m.successCount = recv;
    m.failCount = Math.max(0, total - recv);
    m.errorRate = total > 0 ? m.failCount / total : 0;
    m.rps = total;
    m.rawOutput = log;
    return m;
};
exports.parseHping3 = parseHping3;
// siege: "Transactions: N", "Availability: X%"
const parseSiege = (log) => {
    const m = base();
    const trans = log.match(/Transactions:\s+(\d+)/i);
    const avail = log.match(/Availability:\s+([\d.]+)%/i);
    const failed = log.match(/Failed transactions:\s+(\d+)/i);
    const total = trans ? parseInt(trans[1]) : 0;
    const fail = failed ? parseInt(failed[1]) : 0;
    m.totalRequests = total;
    m.successCount = total - fail;
    m.failCount = fail;
    m.errorRate = total > 0 ? fail / total : 0;
    m.rps = total / Math.max(1, (log.match(/^Elapsed time:\s+([\d.]+)/im) ? parseFloat((log.match(/^Elapsed time:\s+([\d.]+)/im) || ['', '1'])[1]) : 10));
    m.rawOutput = log;
    return m;
};
exports.parseSiege = parseSiege;
// ab: "Complete requests: N", "Failed requests: N", "Requests per second"
const parseAb = (log) => {
    const m = base();
    const complete = log.match(/Complete requests:\s+(\d+)/i);
    const failed = log.match(/Failed requests:\s+(\d+)/i);
    const rps = log.match(/Requests per second:\s+([\d.]+)/i);
    const total = complete ? parseInt(complete[1]) : 0;
    const fail = failed ? parseInt(failed[1]) : 0;
    m.totalRequests = total;
    m.successCount = total - fail;
    m.failCount = fail;
    m.errorRate = total > 0 ? fail / total : 0;
    m.rps = rps ? parseFloat(rps[1]) : 0;
    m.rawOutput = log;
    return m;
};
exports.parseAb = parseAb;
// slowloris: "Sending headers", "Sent N headers" o similar
const parseSlowloris = (log) => {
    const m = base();
    const sent = log.match(/sent|sending|connection/gi) || [];
    m.totalRequests = sent.length || 1;
    m.successCount = sent.length;
    m.failCount = 0;
    m.rps = sent.length;
    m.rawOutput = log;
    return m;
};
exports.parseSlowloris = parseSlowloris;
//# sourceMappingURL=security.js.map