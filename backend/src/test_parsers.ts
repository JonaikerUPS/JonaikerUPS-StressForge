import * as fs from 'fs';
import { parseLocust } from './metrics/locust';
import { parseHey } from './metrics/hey';
import { parseAutocannon } from './metrics/autocannon';
import { parseVegeta } from './metrics/vegeta';
import { parseBombardier } from './metrics/bombardier';
import { parseK6 } from './metrics/k6';
import { parseArtillery } from './metrics/artillery';
import { parseJMeter } from './metrics/jmeter';
import { parseTaurus } from './metrics/taurus';
import { parseGatling } from './metrics/gatling';

const tests: { name: string; parser: (s: string) => any; logFile: string }[] = [
  { name: 'locust', parser: parseLocust, logFile: '/app/backend/results/test_locust.log' },
  { name: 'hey', parser: parseHey, logFile: '/app/backend/results/test_hey.log' },
  { name: 'autocannon', parser: parseAutocannon, logFile: '/app/backend/results/test_autocannon.log' },
  { name: 'vegeta', parser: parseVegeta, logFile: '/app/backend/results/test_vegeta.log' },
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
