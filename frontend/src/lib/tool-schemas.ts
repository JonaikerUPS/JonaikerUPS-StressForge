
export interface Parameter {
  id: string;
  label: string;
  type: 'number' | 'text';
  placeholder: string;
  description: string;
}

export interface ToolSchema {
  label: string;
  parameters: Parameter[];
}

export const TOOL_SCHEMAS: Record<string, ToolSchema> = {
  k6: {
    label: 'k6',
    parameters: [
      { id: 'concurrency', label: 'Concurrent Users', type: 'number', placeholder: '10', description: 'Número de usuarios virtuales ejecutando el script simultáneamente.' },
      { id: 'requests', label: 'Requests per User', type: 'number', placeholder: '5', description: 'Cantidad de iteraciones que cada usuario realiza.' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '30', description: 'Tiempo total de ejecución de la prueba.' },
      { id: 'rampUp', label: 'Ramp-up (s)', type: 'number', placeholder: '5', description: 'Tiempo para alcanzar la carga completa de usuarios.' }
    ]
  },
  artillery: {
    label: 'Artillery',
    parameters: [
      { id: 'concurrency', label: 'Concurrent Users', type: 'number', placeholder: '10', description: 'Usuarios virtuales activos.' },
      { id: 'requests', label: 'Requests per User', type: 'number', placeholder: '5', description: 'Peticiones por usuario.' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '60', description: 'Tiempo total de la carga.' },
      { id: 'rampUp', label: 'Ramp-up (s)', type: 'number', placeholder: '10', description: 'Tiempo de escalado gradual de usuarios.' }
    ]
  },
  locust: {
    label: 'Locust',
    parameters: [
      { id: 'concurrency', label: 'Concurrent Users', type: 'number', placeholder: '100', description: 'Total de usuarios virtuales simulados.' },
      { id: 'requests', label: 'Requests per User', type: 'number', placeholder: '5', description: 'Número de tareas a ejecutar por usuario.' },
      { id: 'rampUp', label: 'Ramp-up (s)', type: 'number', placeholder: '10', description: 'Número de nuevos usuarios creados por segundo.' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '60', description: 'Tiempo de duración de la prueba.' }
    ]
  },
  jmeter: {
    label: 'JMeter',
    parameters: [
      { id: 'concurrency', label: 'Threads', type: 'number', placeholder: '50', description: 'Número de hilos (usuarios) simultáneos.' },
      { id: 'requests', label: 'Requests per User', type: 'number', placeholder: '5', description: 'Peticiones por cada hilo.' },
      { id: 'rampUp', label: 'Ramp-up (s)', type: 'number', placeholder: '10', description: 'Tiempo para lanzar todos los hilos.' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '60', description: 'Tiempo total de la prueba.' }
    ]
  },
  autocannon: {
    label: 'Autocannon',
    parameters: [
      { id: 'concurrency', label: 'Connections', type: 'number', placeholder: '10', description: 'Número de conexiones abiertas simultáneas.' },
      { id: 'requests', label: 'Requests per User', type: 'number', placeholder: '5', description: 'Peticiones a enviar por conexión.' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '10', description: 'Tiempo de ejecución del benchmark.' },
      { id: 'rampUp', label: 'Ramp-up (s)', type: 'number', placeholder: '2', description: 'Tiempo para alcanzar la concurrencia máxima.' }
    ]
  },
  taurus: {
    label: 'Taurus',
    parameters: [
      { id: 'concurrency', label: 'Concurrency', type: 'number', placeholder: '50', description: 'Usuarios concurrentes para el orquestador.' },
      { id: 'requests', label: 'Requests per User', type: 'number', placeholder: '5', description: 'Peticiones por cada usuario.' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '60', description: 'Tiempo que se mantiene la carga máxima.' },
      { id: 'rampUp', label: 'Ramp-up (s)', type: 'number', placeholder: '10', description: 'Tiempo de rampa de subida de carga.' }
    ]
  },
  hey: {
    label: 'Hey',
    parameters: [
      { id: 'concurrency', label: 'Concurrency', type: 'number', placeholder: '50', description: 'Número de trabajadores concurrentes.' },
      { id: 'requests', label: 'Total Requests', type: 'number', placeholder: '200', description: 'Total de peticiones a realizar en la prueba.' },
      { id: 'rampUp', label: 'Ramp-up (s)', type: 'number', placeholder: '2', description: 'Tiempo de aceleración inicial.' }
    ]
  },
  bombardier: {
    label: 'Bombardier',
    parameters: [
      { id: 'concurrency', label: 'Connections', type: 'number', placeholder: '100', description: 'Conexiones HTTP concurrentes.' },
      { id: 'requests', label: 'Total Requests', type: 'number', placeholder: '10000', description: 'Total de peticiones de estrés.' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '30', description: 'Tiempo total de la prueba.' }
    ]
  },
  vegeta: {
    label: 'Vegeta',
    parameters: [
      { id: 'concurrency', label: 'Rate (rps)', type: 'number', placeholder: '50', description: 'Peticiones por segundo (fijas).' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '5', description: 'Tiempo del ataque sostenido.' }
    ]
  },
  gatling: {
    label: 'Gatling',
    parameters: [
      { id: 'concurrency', label: 'Users', type: 'number', placeholder: '100', description: 'Usuarios virtuales concurrentes.' },
      { id: 'duration', label: 'Duration (s)', type: 'number', placeholder: '60', description: 'Tiempo de la simulación.' }
    ]
  }
};

export type ToolOption = 'k6' | 'artillery' | 'locust' | 'jmeter' | 'autocannon' | 'taurus' | 'hey' | 'bombardier' | 'vegeta' | 'gatling' | 'simulacion' | 'all';

