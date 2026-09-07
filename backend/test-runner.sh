#!/bin/bash
# Uso: ./backend/test-runner.sh [herramienta] [target: backend|frontend] [opciones adicionales...]

CONTAINER="stress_test_backend"
TOOL=$1
TARGET=$2
shift 2 # Quita herramienta y target, deja args

# Comprobación de infraestructura
if [ "$(docker inspect -f '{{.State.Running}}' $CONTAINER 2>/dev/null)" != "true" ]; then
  echo "Error: El contenedor $CONTAINER no está corriendo."
  exit 1
fi

# Configuración de objetivo
if [ -z "$TARGET" ]; then TARGET="backend"; fi
if [ "$TARGET" == "backend" ]; then URL="http://backend:8080"; fi
if [ "$TARGET" == "frontend" ]; then URL="http://frontend:3000"; fi

if [ -z "$TOOL" ] || [ -z "$URL" ]; then
  echo "Uso: ./backend/test-runner.sh [herramienta] [backend|frontend] [args]"
  exit 1
fi

echo "--- Iniciando $TOOL contra $TARGET ($URL) ---"

case $TOOL in
  "k6")
    docker cp ./backend/tests/script.js $CONTAINER:/tmp/test.js
    docker exec $CONTAINER k6 run -v -e TARGET_URL=$URL/api/tests /tmp/test.js
    ;;
  "autocannon")
    # Para autocannon, pasamos la URL explícitamente y ajustamos si es backend
    TEST_URL=$URL
    if [ "$TARGET" == "backend" ]; then TEST_URL="$URL/api/tests"; fi
    docker exec $CONTAINER autocannon $@ $TEST_URL
    ;;
  "jmeter")
    docker cp ./backend/tests/plan.jmx $CONTAINER:/tmp/plan.jmx
    docker exec $CONTAINER jmeter -n -t /tmp/plan.jmx -l /tmp/results.jtl
    docker cp $CONTAINER:/tmp/results.jtl ./backend/results.jtl
    echo "Resultados: ./backend/results.jtl"
    ;;
  "locust")
    docker cp ./backend/tests/locustfile.py $CONTAINER:/tmp/locustfile.py
    docker exec $CONTAINER locust -f /tmp/locustfile.py --headless -u 10 -r 5 --run-time 30s --host $URL
    ;;
  "taurus")
    docker cp ./backend/tests/taurus-config.yml $CONTAINER:/tmp/taurus-config.yml
    docker exec $CONTAINER bzt /tmp/taurus-config.yml
    ;;
  "artillery")
    docker exec $CONTAINER artillery quick --count 10 --num 20 $URL
    ;;
  "hey")
    docker exec $CONTAINER hey $@ $URL
    ;;
  "bombardier")
    docker exec $CONTAINER bombardier $@ $URL
    ;;
  "clean")
    echo "Limpiando archivos temporales en $CONTAINER..."
    docker exec $CONTAINER rm -f /tmp/*.jmx /tmp/*.js /tmp/*.py /tmp/*.jtl /tmp/*.yml
    echo "Limpieza completada."
    ;;
  *)
    echo "Herramienta '$TOOL' no reconocida."
    ;;
esac
