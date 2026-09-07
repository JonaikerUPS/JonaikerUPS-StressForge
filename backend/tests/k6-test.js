import http from 'k6/http';
import { check } from 'k6';

const TARGET = __ENV.TARGET_URL || 'http://127.0.0.1:8080';

export default function () {
  let res = http.get(TARGET);
  let success = check(res, { 'status is 200': (r) => r.status === 200 });

  if (!success) {
    console.log(`[ERROR] URL: ${TARGET} | Status: ${res.status} ${res.status_text || ''}`);
  }
}
