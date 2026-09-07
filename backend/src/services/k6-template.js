import http from 'k6/http';
import { sleep } from 'k6';

const TARGET_URL = __ENV.TARGET_URL || 'https://test.k6.io';

export default function () {
  http.get(TARGET_URL); 
  sleep(1);
}