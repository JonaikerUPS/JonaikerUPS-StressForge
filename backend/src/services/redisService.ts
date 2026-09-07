import { createClient } from 'redis';

const client = createClient({
  url: 'redis://redis:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));

// Conectar al iniciar
client.connect().then(() => console.log('Redis connected')).catch(console.error);

export default client;
