const dictionary: Record<string, string> = {
  // Estados y Ciclo de vida
  "Starting": "Iniciando",
  "Phase started": "Fase iniciada",
  "Phase completed": "Fase completada",
  "Finished with code": "Finalizado con código",
  "Test started": "Prueba iniciada",
  "Test suite complete": "Suite de pruebas completa",
  "Results received": "Resultados recibidos",
  "Completed": "Completado",
  "complete": "completadas",
  "Done": "Hecho",
  "running": "ejecutando",
  "interrupted iterations": "iteraciones interrumpidas",
  
  // Métricas y Estadísticas
  "Metrics for period to": "Métricas para el periodo hasta",
  "Statistics": "Estadísticas",
  "Avg": "Prom",
  "Stdev": "DesvEst",
  "Max": "Máx",
  "Reqs/sec": "Reqs/seg",
  "Latency": "Latencia",
  "Throughput": "Rendimiento",
  "Request": "Petición",
  "Requests": "Peticiones",
  "Successful": "Exitoso",
  "Failed": "Fallido",
  "HTTP codes": "Códigos HTTP",
  "checks": "verificaciones",
  "data_received": "datos_recibidos",
  "data_sent": "datos_enviados",
  "http_req_duration": "duración_petición_http",
  "http_req_failed": "petición_http_fallida",
  "http_req_receiving": "petición_http_recibiendo",
  "http_req_sending": "petición_http_enviando",
  "http_req_tls_handshaking": "apretón_manos_tls_petición_http",
  "http_req_waiting": "espera_petición_http",
  "http_reqs": "peticiones_http",
  "iteration_duration": "duración_iteración",
  "iterations": "iteraciones",
  "vus": "vus",
  "vus_max": "vus_max",
  
  // Errores y Red
  "Errors": "Errores",
  "Error": "Error",
  "connection timed out": "conexión agotada",
  "server closed connection": "el servidor cerró la conexión",
  "timeout": "tiempo de espera agotado",
  "dial tcp": "marcar tcp",
  "Waiting for server": "Esperando al servidor",
  "Socket connection attempt failed": "Intento de conexión de socket fallido",
};

export const translateLog = (log: string): string => {
  let translated = log;
  // Ordenar por longitud de clave de mayor a menor para evitar sustituciones parciales incorrectas
  const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    const value = dictionary[key];
    // Escapar caracteres especiales para la expresión regular
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'gi');
    translated = translated.replace(regex, value);
  }
  return translated;
};
