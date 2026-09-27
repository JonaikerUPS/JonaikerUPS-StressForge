import http from 'k6/http';
import { check } from 'k6';

const TARGET = __ENV.TARGET_URL || 'http://127.0.0.1:8080';
const METHOD = (__ENV.METHOD || 'GET').toUpperCase();
const BODY = __ENV.BODY || '{}';

export default function () {
  let res;
  let params = { headers: { 'Content-Type': 'application/json' } };
  
  if (METHOD === 'POST') {
    res = http.post(TARGET, BODY, params);
  } else if (METHOD === 'PUT') {
    res = http.put(TARGET, BODY, params);
  } else if (METHOD === 'DELETE') {
    res = http.del(TARGET, null, params);
  } else if (METHOD === 'PATCH') {
    res = http.patch(TARGET, BODY, params);
  } else {
    res = http.get(TARGET, params);
  }

  check(res, { 'status is success': (r) => r.status >= 200 && r.status < 400 });
}
