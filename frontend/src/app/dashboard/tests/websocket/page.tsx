"use client";

import { useState, useEffect, useRef } from "react";
import { Radio, Play, StopCircle, Wifi, WifiOff, Activity, Users, FileText, Download } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useUnifiedTest } from "@/lib/unified-test-context";
import { getBackendUrl } from "@/lib/api-url";
import { useTestResults } from "@/lib/test-results-context";
import { useSocket } from "@/lib/socket-context"; // AÑADIDO
import Chart from "react-apexcharts";
import { type ApexOptions } from "apexcharts";

export default function WebsocketTestsPage() {
  const { intervalMs, selectedTool } = useUnifiedTest();

  const { publishWsResults, setActiveLogs } = useTestResults();
  const [connected, setConnected] = useState(false);
  const [messagesSent, setMessagesSent] = useState(0);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [errors, setErrors] = useState(0); 
  const [packetLoss, setPacketLoss] = useState(0);
  const [throughput, setThroughput] = useState(0);
  const [jitter, setJitter] = useState(0); // NUEVO
  const [p95, setP95] = useState(0); // NUEVO
  const [p99, setP99] = useState(0); // NUEVO
  const [running, setRunning] = useState(false);
  const [customMsg, setCustomMsg] = useState("");
  const [localLogs, setLocalLogs] = useState<string[]>([]);
  const [latency, setLatency] = useState<number[]>([]);
  const socket = useSocket();
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef({ sent: 0, received: 0, errors: 0 }); 
  const latenciesRef = useRef<number[]>([]);
  const pendingRef = useRef<Map<number, number>>(new Map()); 
  const startTimeRef = useRef<number>(0); // NUEVO

  // Efecto para recalcular métricas avanzadas
  useEffect(() => {
      if (countRef.current.sent > 0) {
          setPacketLoss((countRef.current.errors / countRef.current.sent) * 100);
      }
      if (startTimeRef.current > 0) {
          const durationSecs = (Date.now() - startTimeRef.current) / 1000;
          setThroughput(durationSecs > 0 ? countRef.current.received / durationSecs : 0);
      }
  }, [messagesSent, messagesReceived, errors]);

  // Efecto para actualizar resultados en tiempo real
  useEffect(() => {
    if (running) {
        const avg = latenciesRef.current.length ? Math.round(latenciesRef.current.reduce((a, b) => a + b, 0) / latenciesRef.current.length) : 0;
        publishWsResults({ messagesSent: countRef.current.sent, messagesReceived: countRef.current.received, avgLatency: avg, latencyHistory: [...latenciesRef.current] });
    }
  }, [messagesSent, messagesReceived, running, publishWsResults]);

  const addLog = (msg: string) => {
    const logEntry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setActiveLogs('websocket', (prev: string) => prev + `[${selectedTool}] ${msg}\n`);
    setLocalLogs(prev => [...prev, logEntry]);
  };

  const sendFuzzPayload = () => {
      socket?.emit("client-message", { id: "fuzz", text: { invalid: "data", arr: [1, null] } });
      addLog("Enviado payload de Fuzzing (invalid json structure)");
  };

  const sendCustomMsg = () => {
    if (!socket || !customMsg.trim()) return;
    const id = Date.now();
    socket.emit("client-message", { id, text: customMsg });
    addLog(`Enviando: ${customMsg}`);
    setCustomMsg("");
  };

  const testAuthHandshake = () => {
      // Simulación de intento de conexión con token inválido
      const backendUrl = getBackendUrl();
      const s = require("socket.io-client").io(backendUrl, { auth: { token: "invalid-token" } });
      s.on("connect_error", (err: any) => {
          addLog(`Auth Test: Servidor rechazó token inválido: ${err.message}`);
          s.disconnect();
      });
      s.on("connect", () => {
          addLog("Auth Test: Servidor aceptó token inválido (¡Error de seguridad!)");
          s.disconnect();
      });
  };

  const simulateConcurrency = () => {
      const count = 5;
      addLog(`Iniciando simulación de ${count} conexiones concurrentes...`);
      for (let i = 0; i < count; i++) {
          const s = require("socket.io-client").io(getBackendUrl());
          s.on("connect", () => {
              addLog(`Cliente ${i + 1} conectado`);
              setTimeout(() => s.disconnect(), 2000);
          });
      }
  };

  const downloadLogsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localLogs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "websocket_logs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const startMessaging = () => {
    const safeInterval = intervalMs > 10000 ? 2000 : intervalMs;
    if (intervalRef.current) clearInterval(intervalRef.current);
    addLog(`Enviando mensajes cada ${safeInterval}ms (Delay: ${throttleDelay}ms, Payload: ${payloadSize}KB)...`);

    intervalRef.current = setInterval(() => {
      const id = Date.now();
      countRef.current.sent++;
      setMessagesSent(countRef.current.sent);
      pendingRef.current.set(id, Date.now());

      // Simulación de carga (Payload)
      const payload = "x".repeat(payloadSize * 1024);

      // Simulación de Throttling
      setTimeout(() => {
        socket?.emit("client-message", { id, text: "ping", payload });
      }, throttleDelay);

      // Timeout para detección de error
      setTimeout(() => {
          if (pendingRef.current.has(id)) {
              pendingRef.current.delete(id);
              countRef.current.errors++;
              setErrors(countRef.current.errors);
              addLog(`Error: Timeout para mensaje ${id}`);
          }
      }, 5000); // Aumentado a 5s para permitir throttling

    }, safeInterval);
  };

  const toggleTest = () => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setConnected(false);
      setRunning(false);
      const avg = latenciesRef.current.length ? Math.round(latenciesRef.current.reduce((a, b) => a + b, 0) / latenciesRef.current.length) : 0;
      publishWsResults({ messagesSent: countRef.current.sent, messagesReceived: countRef.current.received, avgLatency: avg, latencyHistory: [...latenciesRef.current] });
      addLog("Prueba detenida");
      return;
    }

    countRef.current = { sent: 0, received: 0, errors: 0 };
    latenciesRef.current = [];
    startTimeRef.current = Date.now(); // Iniciar tiempo
    setMessagesSent(0);
    setMessagesReceived(0);
    setErrors(0);
    setPacketLoss(0);
    setThroughput(0);
    setLatency([]);
    setRunning(true);
    setConnected(true);
    addLog("Conectando al servidor WebSocket...");

    startMessaging(); 
  };

  const [payloadSize, setPayloadSize] = useState(1); // en KB
  const [throttleDelay, setThrottleDelay] = useState(0); // en ms
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (!socket) return;
    
    socket.on("server-echo", (data: any) => {
        if (pendingRef.current.has(data.id)) {
            const sentTime = pendingRef.current.get(data.id)!;
            const ms = Date.now() - sentTime;
            pendingRef.current.delete(data.id);
            
            countRef.current.received++;
            latenciesRef.current.push(ms);
            
            // Cálculos Avanzados
            const lats = [...latenciesRef.current];
            const avg = lats.reduce((a, b) => a + b, 0) / lats.length;
            
            // Jitter: promedio de diferencias absolutas
            let jitterSum = 0;
            for (let i = 1; i < lats.length; i++) {
                jitterSum += Math.abs(lats[i] - lats[i - 1]);
            }
            const jtr = lats.length > 1 ? jitterSum / (lats.length - 1) : 0;
            
            // P95, P99
            const sorted = [...lats].sort((a, b) => a - b);
            const p95Idx = Math.floor(sorted.length * 0.95);
            const p99Idx = Math.floor(sorted.length * 0.99);
            
            setMessagesReceived(countRef.current.received);
            setLatency(lats);
            setJitter(Math.round(jtr));
            setP95(sorted[p95Idx]);
            setP99(sorted[p99Idx]);
        }
    });

    socket.on("server-error", (err: any) => {
        addLog(`Error del servidor: ${err.error}`);
    });
    
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      startMessaging();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      socket.off("server-echo");
      socket.off("server-error");
    };
  }, [intervalMs, running, socket]);


  const avgLatency =
    latency.length > 0 ? Math.round(latency.reduce((a, b) => a + b, 0) / latency.length) : 0;

  const downloadPDF = () => {
    const doc = new jsPDF();
    const primaryColor = [15, 23, 42];
    
    // Header Estilizado
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Reporte de WebSocket", 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 30);

    // Tabla de resultados
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Resultados de la Prueba", 14, 55);
    
    autoTable(doc, {
        startY: 60,
        body: [
            ["Mensajes Enviados", messagesSent.toString()],
            ["Mensajes Recibidos", messagesReceived.toString()],
            ["Errores (Timeouts)", errors.toString()],
            ["Pérdida de Paquetes", `${packetLoss.toFixed(1)}%`],
            ["Throughput", `${throughput.toFixed(2)} msg/s`],
            ["Latencia Promedio", `${avgLatency}ms`],
            ["Jitter", `${jitter}ms`],
            ["Latencia P95", `${p95}ms`],
            ["Latencia P99", `${p99}ms`],
            ["Estado Final", connected ? "Conectado" : "Desconectado"]
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor as any },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
    });

    doc.save(`reporte_websocket_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const chartSeries = [
    {
      name: "Latencia (ms)",
      data: latency.slice(-20),
    },
  ];

  const chartOptions: ApexOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: "smooth", width: 2 },
    colors: ["#38bdf8"],
    xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: ["#94a3b8"] } } },
    grid: { strokeDashArray: 4, borderColor: "rgba(148,163,184,0.12)" },
    tooltip: { theme: "dark" },
  };

  return (
    <div className="mx-auto space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-950 dark:text-white">
                Pruebas WebSocket
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Evalúa la comunicación en tiempo real bidireccional
              </p>
            </div>
          </div>
           <button
             onClick={toggleTest}
             className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
               running
                 ? "bg-red-500 shadow-red-500/30 hover:bg-red-600"
                 : "bg-sky-500 shadow-sky-500/30 hover:bg-sky-600"
             }`}
           >
             {running ? (
               <>
                 <StopCircle className="h-4 w-4" /> Detener
               </>
             ) : (
               <>
                 <Play className="h-4 w-4" /> Iniciar prueba
               </>
             )}
           </button>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Download className="h-4 w-4" /> Exportar PDF
            </button>
            <button
              onClick={downloadLogsJSON}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <FileText className="h-4 w-4" /> Exportar JSON
            </button>
          </div>
        </div>

        {/* CONTROLES DE CONFIGURACIÓN */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tamaño Payload (KB)</label>
                <input type="number" value={payloadSize} onChange={(e) => setPayloadSize(Number(e.target.value))} className="w-full rounded-xl border border-slate-300 p-2 dark:bg-slate-800 dark:border-slate-700" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Throttle Delay (ms)</label>
                <input type="number" value={throttleDelay} onChange={(e) => setThrottleDelay(Number(e.target.value))} className="w-full rounded-xl border border-slate-300 p-2 dark:bg-slate-800 dark:border-slate-700" />
        </div>
       </div>


       <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex items-center gap-3">
            {connected ? (
              <Wifi className="h-5 w-5 text-emerald-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <p className="text-lg text-slate-500 dark:text-slate-400">Estado</p>
              <p
                className={`text-sm font-semibold ${
                  connected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {connected ? "Conectado" : "Desconectado"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-sky-500" />
            <div>
              <p className="text-lg text-slate-500 dark:text-slate-400">Mensajes</p>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {messagesSent} enviados / {messagesReceived} recibidos
              </p>
              <p className="text-xs text-red-500">
                {errors} errores ({packetLoss.toFixed(1)}% pérdida)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-lg text-slate-500 dark:text-slate-400">Latencia promedio</p>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {running ? `${avgLatency}ms` : "--"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-lg text-slate-500 dark:text-slate-400">Jitter / P95 / P99</p>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {running ? `${jitter}ms / ${p95}ms / ${p99}ms` : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN DE MÉTRICAS DETALLADAS */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <p className="text-sm text-slate-500">Jitter (Variabilidad)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{running ? `${jitter}ms` : "--"}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <p className="text-sm text-slate-500">P95 Latencia</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{running ? `${p95}ms` : "--"}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
            <p className="text-sm text-slate-500">P99 Latencia</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{running ? `${p99}ms` : "--"}</p>
        </div>
      </div>

      {/* NUEVA SECCIÓN DE DIAGNÓSTICO */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Diagnóstico de Rendimiento</h2>
        <div className={`text-sm font-semibold p-3 rounded-xl ${
            !running ? "bg-slate-500/10 text-slate-600 dark:text-slate-400" :
            packetLoss > 5 || avgLatency > 300 ? "bg-red-500/10 text-red-600 dark:text-red-400" :
            packetLoss > 1 || avgLatency > 150 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        }`}>
            Estado actual: {
                !running ? "Esperando inicio de la prueba..." :
                packetLoss > 5 || avgLatency > 300 ? "Crítico: Conexión inestable o alta latencia detectada." :
                packetLoss > 1 || avgLatency > 150 ? "Advertencia: Rendimiento subóptimo." :
                "Saludable: Conexión estable y rápida."
            }
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
            Latencia en tiempo real
          </h2>
          <div className="h-64 w-full overflow-hidden pl-1">
            {mounted ? (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                width="100%"
                height={256}
              />
            ) : (
              <div className="h-full w-full animate-pulse rounded-2xl bg-slate-900/50" />
            )}
          </div>
        </div>

         <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
           <h2 className="mb-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
             Consola de Eventos
           </h2>
           <button 
             onClick={() => setLocalLogs([])}
             className="text-xs text-slate-400 hover:text-white mb-2 underline"
           >
             Limpiar consola
           </button>
           <div className="h-64 overflow-y-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-emerald-400">
             {localLogs.length === 0 ? (
                <p className="text-slate-500 italic">Esperando inicio de prueba...</p>
             ) : (
                localLogs.map((log, i) => <p key={i}>{log}</p>)
             )}
           </div>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
                />
                <button onClick={sendCustomMsg} className="bg-sky-600 px-3 py-2 rounded-xl text-xs text-white font-bold">Enviar</button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={sendFuzzPayload} className="bg-red-600 px-3 py-2 rounded-xl text-xs text-white font-bold">Fuzzing</button>
                  <button onClick={testAuthHandshake} className="bg-amber-600 px-3 py-2 rounded-xl text-xs text-white font-bold">Test Auth</button>
                  <button onClick={simulateConcurrency} className="bg-emerald-600 px-3 py-2 rounded-xl text-xs text-white font-bold col-span-2">Simular Concurrencia</button>
              </div>
         </div>

      </div>
    </div>
  );
}
