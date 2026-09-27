"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const locust_1 = require("./metrics/locust");
const hey_1 = require("./metrics/hey");
const autocannon_1 = require("./metrics/autocannon");
const vegeta_1 = require("./metrics/vegeta");
const tests = [
    { name: 'locust', parser: locust_1.parseLocust, logFile: '/app/backend/results/test_locust.log' },
    { name: 'hey', parser: hey_1.parseHey, logFile: '/app/backend/results/test_hey.log' },
    { name: 'autocannon', parser: autocannon_1.parseAutocannon, logFile: '/app/backend/results/test_autocannon.log' },
    { name: 'vegeta', parser: vegeta_1.parseVegeta, logFile: '/app/backend/results/test_vegeta.log' },
];
for (const t of tests) {
    if (!fs.existsSync(t.logFile)) {
        console.log(t.name + ': NO LOG FILE');
        continue;
    }
    const log = fs.readFileSync(t.logFile, 'utf-8');
    const result = t.parser(log);
    const hasData = result.rps > 0 || result.totalRequests > 0;
    console.log(t.name + ': ' + (hasData ? 'OK' : 'ZERO') + ' ' + JSON.stringify(result));
}
//# sourceMappingURL=test_parsers.js.map