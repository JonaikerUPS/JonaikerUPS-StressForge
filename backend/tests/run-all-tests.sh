#!/bin/sh

TOOL_TO_RUN=$1
TARGET_URL=$2
RESULTS_FILE_NAME=${3:-"default.log"}
CONCURRENCY=$4
DURATION=$5
RAMPUP=$6
ITERATIONS=$7
RESULTS_DIR="/app/backend/results"
mkdir -p $RESULTS_DIR

run_tool() {
  local tool=$1
  case "$tool" in
    k6)
        k6 run -v -e VUS=$CONCURRENCY -e DURATION=${DURATION}s -e ITERATIONS=$ITERATIONS -e TARGET_URL=$TARGET_URL -e RAMPUP=${RAMPUP}s /tests/k6-test.js 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    artillery)
        npx artillery quick --count $CONCURRENCY --num $ITERATIONS "$TARGET_URL" 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    autocannon)
        npx autocannon -c $CONCURRENCY -d ${DURATION}s "$TARGET_URL" 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    hey)
        hey -c $CONCURRENCY -z ${DURATION}s "$TARGET_URL" 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    bombardier)
        bombardier -c $CONCURRENCY -d ${DURATION}s "$TARGET_URL" 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    vegeta)
        echo "GET $TARGET_URL" | /usr/local/bin/vegeta attack -rate=$CONCURRENCY -duration=${DURATION}s | /usr/local/bin/vegeta report 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    jmeter)
        sed -e "s/CONCURRENCY_PLACEHOLDER/$CONCURRENCY/g; s/RAMPUP_PLACEHOLDER/$RAMPUP/g; s/DURATION_PLACEHOLDER/$DURATION/g; s/ITERATIONS_PLACEHOLDER/$ITERATIONS/g" /tests/plan.jmx > /tmp/plan_$$.jmx
        jmeter -n -t /tmp/plan_$$.jmx 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    locust)
        TARGET_URL=$TARGET_URL locust -f /tests/locustfile.py --headless -u $CONCURRENCY -r $RAMPUP --run-time ${DURATION}s --host "$TARGET_URL" 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    taurus)
        bzt -o execution.0.concurrency=$CONCURRENCY -o execution.0.ramp-up=${RAMPUP}s -o execution.0.hold-for=${DURATION}s -o scenarios.simple-load.default-address=$TARGET_URL /tests/taurus-config.yml 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    gatling)
        GATLING_DIR="/opt/gatling-charts-highcharts-bundle-3.14.9.1"
        mkdir -p $GATLING_DIR/src/test/scala/stressforge
        cp /tests/simulations/StressTestSimulation.scala $GATLING_DIR/src/test/scala/stressforge/
        export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
        cd $GATLING_DIR && ./mvnw gatling:test -q -Dgatling.simulationClass=stressforge.StressTestSimulation -DtargetUrl=$TARGET_URL -Dconcurrency=$CONCURRENCY -Dduration=$DURATION 2>&1 | tee $RESULTS_DIR/$RESULTS_FILE_NAME
        ;;
    *)
        echo "[ERROR] Herramienta no soportada: $tool"
        return 1
        ;;
  esac
  echo "TOOL_DONE:$tool"
}

if [ "$TOOL_TO_RUN" = "all" ]; then
  for tool in k6 artillery autocannon hey bombardier vegeta jmeter locust gatling; do
    run_tool $tool
  done
else
  run_tool $TOOL_TO_RUN
fi

echo "[INFO] Prueba completada."


