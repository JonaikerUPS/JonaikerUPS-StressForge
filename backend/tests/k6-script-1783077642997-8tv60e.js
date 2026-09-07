import http from 'k6/http';
import { sleep, check } from 'k6';
export default function () {
  const res = http.get('http://backend:4000');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(0.1);
}