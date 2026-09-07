export const generateToolScript = (ep: any, tool: string): string => {
  const method = ep.method || 'GET';
  const url = ep.endpoint || 'http://localhost';
  const body = ep.requestBody || '{}';
  
  const formattedBody = (() => {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  })();

  const headers = ep.headers || {};
  const headersString = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');

  switch (tool) {
    case 'k6':
      return `import http from 'k6/http';

export default function () {
  const params = { headers: { ${Object.entries(headers).map(([k, v]) => `"${k}": "${v}"`).join(', ')} } };
  http.${method.toLowerCase()}('${url}', ${formattedBody}, params);
}`;
    
    case 'taurus': {
      const execParams: string[] = [`  - scenario: taurus-test`];
      if (ep.concurrency !== undefined && ep.concurrency !== null && ep.concurrency > 0) {
        execParams.push(`    concurrency: ${ep.concurrency}`);
      }
      if (ep.rampUp !== undefined && ep.rampUp !== null && ep.rampUp > 0) {
        const unit = ep.rampUpUnit || 's';
        execParams.push(`    ramp-up: ${ep.rampUp}${unit}`);
      }
      if (ep.duration !== undefined && ep.duration !== null && ep.duration > 0) {
        const unit = ep.durationUnit || 's';
        execParams.push(`    hold-for: ${ep.duration}${unit}`);
      }
      if (ep.requests !== undefined && ep.requests !== null && ep.requests > 0) {
        execParams.push(`    iterations: ${ep.requests}`);
      }

      return `execution:
${execParams.join('\n')}

scenarios:
  taurus-test:
    requests:
      - url: ${url}
        method: ${method}
        headers:
${headersString ? headersString.split('\n').map(h => `          ${h}`).join('\n') : '          Content-Type: application/json'}
        body: |
${formattedBody.split('\n').map(l => `          ${l}`).join('\n')}`;
    }

    case 'artillery':
      return `execution:
  - scenario: ${tool}-test

scenarios:
  ${tool}-test:
    requests:
      - url: ${url}
        method: ${method}
        headers:
${headersString ? headersString.split('\n').map(h => `          ${h}`).join('\n') : '          Content-Type: application/json'}
        body: |
${formattedBody.split('\n').map(l => `          ${l}`).join('\n')}`;

    case 'locust':
      return `from locust import HttpUser, task, between

class QuickstartUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def test_request(self):
        self.client.${method.toLowerCase()}("${url}", json=${formattedBody}, headers=${JSON.stringify(headers)})`;


    case 'jmeter':
      return `<!-- JMeter Test Plan -->
<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="HTTP Request">
  <stringProp name="HTTPSampler.domain">${url}</stringProp>
  <stringProp name="HTTPSampler.method">${method}</stringProp>
  <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
</HTTPSamplerProxy>`;

    case 'autocannon':
      return `npx autocannon -c ${ep.concurrency || 10} -d ${ep.duration || 10} -m ${method} -b '${body}' "${url}"`;

    case 'hey':
      return `hey -n ${ep.requests || 100} -c ${ep.concurrency || 10} -m ${method} -d '${body}' "${url}"`;

    case 'bombardier':
      return `bombardier -c ${ep.concurrency || 10} -n ${ep.requests || 100} -m ${method} -b '${body}' "${url}"`;

    case 'vegeta':
      return `echo "GET ${url}" | vegeta attack -rate=${ep.concurrency || 10} -duration=${ep.duration || 10}s | vegeta report`;

    default:
      return `${tool} command not implemented for preview.`;
  }
};
