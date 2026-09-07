cd /tmp
cat > test.jmx << 'XML'
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Plan"/>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Users">
        <intProp name="ThreadGroup.num_threads">1</intProp>
        <intProp name="ThreadGroup.ramp_time">1</intProp>
        <longProp name="ThreadGroup.duration">3</longProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Request">
          <stringProp name="HTTPSampler.domain">nginx.org</stringProp>
          <stringProp name="HTTPSampler.port">80</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <stringProp name="HTTPSampler.path">/</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
XML
echo 'Starting JMeter...'
date +%T
jmeter -n -t /tmp/test.jmx -l /tmp/results.jtl 2>&1 &
PID=$!
sleep 8
if kill -0 $PID 2>/dev/null; then
  echo 'Still running after 8s, killing...'
  kill $PID
  wait $PID 2>/dev/null
  echo 'KILLED'
else
  wait $PID
  echo 'FINISHED'
fi
date +%T
echo 'JTL size:' $(wc -c < /tmp/results.jtl 2>/dev/null)
head -3 /tmp/results.jtl 2>/dev/null
rm -f /tmp/test.jmx /tmp/results.jtl
