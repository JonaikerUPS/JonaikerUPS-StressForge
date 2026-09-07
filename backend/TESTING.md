# Guía de Pruebas de Estrés

Este sistema permite ejecutar pruebas de carga sobre el **backend** o **frontend** utilizando múltiples herramientas.

## Uso del Runner
Desde la raíz del proyecto, usa `./backend/test-runner.sh`:

```bash
./backend/test-runner.sh [herramienta] [backend|frontend] [args]
```

### Ejemplos

1.  **Testear Backend (por defecto):**
    `./backend/test-runner.sh autocannon backend -c 50 -d 10`

2.  **Testear Frontend:**
    `./backend/test-runner.sh autocannon frontend -c 50 -d 10`

3.  **Testear Frontend con K6:**
    `./backend/test-runner.sh k6 frontend`

### Mantenimiento
- **Limpiar temporales:** `./backend/test-runner.sh clean`
