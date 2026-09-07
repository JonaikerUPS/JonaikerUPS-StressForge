// 1. Header (Se imprime solo una vez al inicio)
const HEADER_CODE = [
  "================================================================================",
  "          CREATIVE COMMONS / SECURITY AUDIT & PENETRATION TESTING SUITE",
  "================================================================================",
  "[VERSION]: 4.0.2-BETA",
  "[TARGET]: INTERNAL_NETWORK_COMPLIANCE_TEST",
  "[WARNING]: AUTHORIZED USE ONLY. DO NOT EXECUTE IN PRODUCTION ENVIRONMENTS.",
  "================================================================================"
];

// 2. Líneas de acción (Solo el contenido dinámico)
const ACTIONS_LEFT = [
  "GET /api/v1/stress-test/start HTTP/1.1",
  '{"action": "load-test", "target": "node-01", "intensity": "high"}',
  "SELECT * FROM metrics WHERE timestamp > NOW() - INTERVAL '5 minutes';",
  "[INFO] Injecting traffic: 5000 rps",
  "wss://stress-forge.io/ws/monitor/stream",
  "GET /api/v1/auth/validate HTTP/1.1",
  '{"user_id": "admin", "session": "active"}',
  "SELECT cpu_usage, ram_usage FROM system_stats ORDER BY timestamp DESC LIMIT 1;",
  "[INFO] Traffic distribution: 80% WebSocket, 20% REST",
  "wss://stress-forge.io/ws/control/cmd",
  "GET /api/v2/nodes/list HTTP/1.1",
  '{"query": "health_check", "recursive": true}',
  "SELECT COUNT(*) FROM active_connections WHERE status = 'connected';",
  "GET /api/v1/metrics/snapshot HTTP/1.1",
  '{"range": "1h", "resolution": "10s"}',
];

const ACTIONS_RIGHT = [
  "[DEBUG] WebSocket connection established...",
  "INSERT INTO logs (level, message) VALUES ('WARN', 'High latency detected');",
  "gRPC call: StreamMetricsRequest{node_id: 'node-05'}",
  "[STRESS] Payload test: 85% capacity reached",
  "UPDATE nodes SET status = 'overloaded' WHERE id = 'node-03';",
  "HTTP/1.1 200 OK - Response Time: 12ms",
  "[DEBUG] Pushing telemetry to dashboard...",
  "INSERT INTO audit_trail (user, action) VALUES ('admin', 'start_load_test');",
  "gRPC call: StreamLogsResponse{code: 200, message: 'OK'}",
  "[STRESS] Threshold alert: 90% CPU on node-08",
  "UPDATE metrics SET value = 0.95 WHERE metric_id = 'cpu_usage_08';",
  "HTTP/1.1 201 Created - Request ID: req-8892",
  "[DEBUG] Cleaning up temporary socket session-7712...",
  "INSERT INTO alerts (source, severity) VALUES ('node-05', 'CRITICAL');",
  "gRPC call: StreamControl{action: 'terminate_node_08'}",
];

// 3. Función para simular el streaming
function startTerminalEffect() {
  // Imprimir header una sola vez
  HEADER_CODE.forEach(line => console.log(line));
  
  let i = 0;
  // Intervalo que imprime líneas alternas o de ambos arrays
  setInterval(() => {
    if (i >= ACTIONS_LEFT.length) i = 0; // Bucle infinito
    
    console.log(`[LEFT]  ${ACTIONS_LEFT[i]}`);
    console.log(`[RIGHT] ${ACTIONS_RIGHT[i]}`);
    console.log('----------------------------------------------------');
    i++;
  }, 1000); // Velocidad: 1 segundo
}

startTerminalEffect();
