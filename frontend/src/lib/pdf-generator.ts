import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const generateELI5Summary = (data: any[], errorDetails?: string, percentilesData?: Record<string, number>) => {
  let summary = "";
  if (errorDetails) {
    summary += `Hubo problemas durante la prueba: ${errorDetails.substring(0, 150)}. Esto significa que el sistema no pudo completar todas las peticiones correctamente y necesita atención técnica. `;
  } else {
    summary += "¡La prueba fue un éxito! El sistema respondió correctamente a todas las peticiones sin errores. ";
  }

  // Análisis de latencia (Velocidad)
  if (data.length > 0 && data[0].latency?.avg) {
      const avg = data[0].latency.avg;
      if (avg < 200) summary += "La velocidad de respuesta es muy rápida, excelente desempeño. ";
      else if (avg < 500) summary += "La velocidad de respuesta es aceptable, pero hay margen de mejora. ";
      else summary += "La velocidad de respuesta es lenta. El sistema está tardando mucho en procesar las peticiones, se recomienda optimizar. ";
  }

  // Análisis de consistencia (P99)
  if (percentilesData && percentilesData['99.0'] && percentilesData['50.0']) {
      const p99 = percentilesData['99.0'];
      const p50 = percentilesData['50.0'];
      if (p99 > p50 * 3) {
          summary += "Hemos notado que algunos usuarios (el 1% más lento) experimentaron esperas mucho más largas que el resto, lo que indica picos de saturación puntuales.";
      }
  }

  return summary;
};

const detectFailureTippingPoint = (rawLogs: string) => {
  if (!rawLogs) return null;
  const lines = rawLogs.split('\n');
  for (const line of lines) {
    // Regex robusto para capturar "Current: 50 vu..." y "fail 1.377"
    const match = line.match(/Current:\s*(\d+)\s+vu.*fail\s+([\d.]+)/i);
    if (match) {
      const vu = match[1];
      const failVal = parseFloat(match[2]); // Parseamos como float por si es 1.377
      if (failVal > 0) {
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
        const time = timeMatch ? timeMatch[1] : 'desconocido';
        return `El primer fallo ocurrió a las ${time}, con ${vu} usuarios virtuales activos.`;
      }
    }
  }
  return null;
};

const generateRecommendations = (data: any[], errorDetails?: string, rawLogs?: string) => {
  let recs = [];
  if (errorDetails) {
    recs.push("• Revisar los logs del servidor en busca de errores 5xx.");
    recs.push("• Verificar la estabilidad de la conexión con la base de datos y servicios externos.");
    recs.push("• Comprobar la configuración del balanceador de carga o gateway.");
    
    if (rawLogs) {
        const tippingPoint = detectFailureTippingPoint(rawLogs);
        if (tippingPoint) recs.push(`• ${tippingPoint}`);
    }
  }
  // ... rest of existing recommendations
  if (data.length > 0 && data[0].latency?.avg > 500) {
    recs.push("• Optimizar las consultas a la base de datos (revisar índices).");
    recs.push("• Implementar o mejorar la capa de caché (ej. Redis).");
    recs.push("• Evaluar la necesidad de escalar los recursos del servidor.");
  }
  if (recs.length === 0) {
    recs.push("• El sistema se comporta de forma estable. Continuar monitoreando regularmente.");
  }
  return recs;
};

export const generateReportPdf = (toolName: string, data: any[], endpointsData?: any[], errorDetails?: string, percentilesData?: Record<string, number>, rawLogs?: string) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`Reporte Ejecutivo: ${toolName.toUpperCase()}`, 14, 22);
  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 30);

  // Resumen ELI5
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Resumen para todos (ELI5)', 14, 20);
  doc.setFontSize(12);
  const eli5 = generateELI5Summary(data, errorDetails, percentilesData);
  const splitEli5 = doc.splitTextToSize(eli5, 180);
  doc.text(splitEli5, 14, 30);

  // Recomendaciones
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Recomendaciones de Acción', 14, 20);
  doc.setFontSize(10);
  const recs = generateRecommendations(data, errorDetails, rawLogs);
  recs.forEach((rec, index) => {
      doc.text(rec, 14, 30 + (index * 10));
  });

  // Sección de diagnóstico de errores
  if (errorDetails) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(200, 0, 0);
    doc.text('Diagnóstico Técnico de Fallos', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const splitError = doc.splitTextToSize(errorDetails, 180);
    doc.text(splitError, 14, 30);
  }

  // Tabla de Percentiles
  if (percentilesData && Object.keys(percentilesData).length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Análisis de Percentiles (ms)', 14, 20);
      const pData = Object.entries(percentilesData).map(([p, v]) => [p, v]);
      autoTable(doc, {
        startY: 25,
        head: [['Percentil', 'Tiempo (ms)']],
        body: pData,
      });
  }

  // Tabla principal
  if (data.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Resumen de Rendimiento', 14, 20);
    const tableData = data.map(item => [
      item.time || 'N/A',
      item.vus || 0,
      item.rps || 0,
      item.latency?.avg || 0
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['Tiempo', 'VUs', 'RPS', 'Latencia Avg (ms)']],
      body: tableData,
    });
  }

  // Tabla detallada por endpoint
  if (endpointsData && endpointsData.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Análisis Detallado por Endpoint', 14, 20);
    
    const epTableData = endpointsData.map(ep => [
      ep.url,
      ep.method,
      ep.totalRequests,
      ep.failCount,
      `${(ep.avgLatency || 0).toFixed(2)}ms`,
      ep.status
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['URL', 'Método', 'Total Req', 'Fallos', 'Latencia Avg', 'Estado']],
      body: epTableData,
    });
  }

  // Logs crudos al final
  if (rawLogs) {
    doc.addPage();
    doc.setFontSize(6); // Fuente más pequeña para que quepa bien
    doc.setFont('Courier');
    doc.text('Logs de ejecución (RAW):', 14, 10);
    const splitLogs = doc.splitTextToSize(rawLogs, 190);
    doc.text(splitLogs, 14, 18);
  }

  doc.save(`reporte_${toolName}_${Date.now()}.pdf`);
};
