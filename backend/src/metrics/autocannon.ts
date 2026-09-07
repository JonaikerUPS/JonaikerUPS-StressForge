import { ToolMetrics } from './types';

export const parseAutocannon = (logContent: string): ToolMetrics => {
  // Autocannon table format:
  // │ Stat │ 2.5% │ 50% │ 97.5% │ 99% │ Avg │ Stdev │ Max │  ← Latency row
  // │ Stat │ 1%   │ 2.5%│ 50%   │ 97.5%│ Avg │ Stdev │ Min │  ← Req/Sec row
  // "9k requests in 5.04s"

  const lines = logContent.split('\n');
  const latLine = lines.find(l => l.includes('Latency') && l.includes('│'));
  const rpsLine = lines.find(l => l.includes('Req/Sec') && l.includes('│'));
  const totalReqMatch = logContent.match(/([\d.]+)k?\s+requests/);

  let totalRequests = 0;
  if (totalReqMatch) {
    const raw = totalReqMatch[1];
    totalRequests = logContent.includes(raw + 'k') ? parseFloat(raw) * 1000 : parseFloat(raw);
  }

  let rps = 0;
  let avgLat = 0;
  let p50: number | undefined;
  let p95: number | undefined;
  let p99: number | undefined;

  if (rpsLine) {
    const parts = rpsLine.split('│').map(p => p.trim());
    // parts: ['', 'Req/Sec', '1,058', '1,058', '1,858', '2,193', '1,742.2', '375.71', '1,058', '']
    // columns: index 6 = Avg
    if (parts[6]) rps = parseFloat(parts[6].replace(/,/g, ''));
  }

  if (latLine) {
    const parts = latLine.split('│').map(p => p.trim());
    // parts: ['', 'Latency', '0 ms', '0 ms', '3 ms', '5 ms', '0.47 ms', '1.15 ms', '29 ms', '']
    // columns: index 3 = 50%, index 4 = 97.5%, index 5 = 99%, index 6 = Avg
    if (parts[6]) avgLat = parseFloat(parts[6].replace(' ms', '').replace(',', ''));
    if (parts[3]) p50 = parseFloat(parts[3].replace(' ms', ''));
    if (parts[4]) p95 = parseFloat(parts[4].replace(' ms', ''));
    if (parts[5]) p99 = parseFloat(parts[5].replace(' ms', ''));
  }

  return {
    rps,
    latency: { avg: avgLat, p50, p95, p99 },
    totalRequests,
    successCount: totalRequests,
    failCount: 0,
    errorRate: 0,
  };
};
