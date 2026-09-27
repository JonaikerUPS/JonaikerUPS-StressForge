"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parsers = void 0;
const k6_1 = require("./k6");
const artillery_1 = require("./artillery");
const autocannon_1 = require("./autocannon");
const hey_1 = require("./hey");
const bombardier_1 = require("./bombardier");
const vegeta_1 = require("./vegeta");
const locust_1 = require("./locust");
const taurus_1 = require("./taurus");
const jmeter_1 = require("./jmeter");
const gatling_1 = require("./gatling");
const security_1 = require("./security");
exports.Parsers = {
    k6: k6_1.parseK6,
    artillery: artillery_1.parseArtillery,
    autocannon: autocannon_1.parseAutocannon,
    hey: hey_1.parseHey,
    bombardier: bombardier_1.parseBombardier,
    vegeta: vegeta_1.parseVegeta,
    locust: locust_1.parseLocust,
    taurus: taurus_1.parseTaurus,
    jmeter: jmeter_1.parseJMeter,
    gatling: gatling_1.parseGatling,
    simulacion: (log) => ({ rps: 0, latency: { avg: 0 }, totalRequests: 0, successCount: 0, failCount: 0, errorRate: 0 }),
    nmap: security_1.parseNmap,
    masscan: security_1.parseMasscan,
    nikto: security_1.parseNikto,
    hydra: security_1.parseHydra,
    sqlmap: security_1.parseSqlmap,
    gobuster: security_1.parseGobuster,
    wfuzz: security_1.parseWfuzz,
    ffuf: security_1.parseFfuf,
    hping3: security_1.parseHping3,
    ab: security_1.parseAb,
    slowloris: security_1.parseSlowloris,
};
//# sourceMappingURL=index.js.map