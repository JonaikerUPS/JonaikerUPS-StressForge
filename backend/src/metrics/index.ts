import { MetricsParser } from './types';
import { parseK6 } from './k6';
import { parseArtillery } from './artillery';
import { parseAutocannon } from './autocannon';
import { parseHey } from './hey';
import { parseBombardier } from './bombardier';
import { parseVegeta } from './vegeta';
import { parseLocust } from './locust';
import { parseTaurus } from './taurus';
import { parseJMeter } from './jmeter';
import { parseGatling } from './gatling';
import { parseNmap, parseMasscan, parseNikto, parseHydra, parseSqlmap, parseGobuster, parseWfuzz, parseFfuf, parseHping3, parseAb, parseSlowloris } from './security';

export const Parsers: Record<string, MetricsParser> = {
  k6: parseK6,
  artillery: parseArtillery,
  autocannon: parseAutocannon,
  hey: parseHey,
  bombardier: parseBombardier,
  vegeta: parseVegeta,
  locust: parseLocust,
  taurus: parseTaurus,
  jmeter: parseJMeter,
  gatling: parseGatling,
  simulacion: (log) => ({ rps: 0, latency: { avg: 0 }, totalRequests: 0, successCount: 0, failCount: 0, errorRate: 0 }),
  nmap: parseNmap,
  masscan: parseMasscan,
  nikto: parseNikto,
  hydra: parseHydra,
  sqlmap: parseSqlmap,
  gobuster: parseGobuster,
  wfuzz: parseWfuzz,
  ffuf: parseFfuf,
  hping3: parseHping3,
  ab: parseAb,
  slowloris: parseSlowloris,
};
