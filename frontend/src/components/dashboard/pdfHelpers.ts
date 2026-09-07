import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Colores del sistema
const COLORS = {
  navy: [15, 23, 42] as [number, number, number],      // #0F172A
  blue: [14, 116, 144] as [number, number, number],    // #0E7490
  emerald: [15, 118, 110] as [number, number, number], // #0F766E
  purple: [107, 33, 168] as [number, number, number],  // #6B21A8
  orange: [194, 65, 12] as [number, number, number],   // #C2410C
  slateBg: [248, 250, 252] as [number, number, number], // #F8FAFC
  border: [226, 232, 240] as [number, number, number], // #E2E8F0
  textDark: [15, 23, 42] as [number, number, number],  // #0F172A
  textLight: [100, 116, 139] as [number, number, number] // #64748B
};

// Función para formatear cuerpos/headers JSON de forma segura
const safeFormatJSON = (data: any): string => {
  if (!data) return "N/A";
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
};

const detectFailureTippingPoint = (rawLogs: string) => {
  if (!rawLogs) return null;
  const lines = rawLogs.split('\n');
  for (const line of lines) {
    const match = line.match(/Current: (\d+) vu.*succ \d+ fail (\d+)/);
    if (match) {
      const vu = match[1];
      const failCount = parseInt(match[2]);
      if (failCount > 0) {
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
        const time = timeMatch ? timeMatch[1] : 'desconocido';
        return `El primer fallo ocurrió a las ${time}, con ${vu} usuarios virtuales activos.`;
      }
    }
  }
  return null;
};

// Diagnóstico Técnico Inteligente
const getDiagnostic = (successRate: number, avgLatency: number, p95: number, p99: number, rawLogs?: string) => {
  let title = "RENDIMIENTO ÓPTIMO";
  let colorBg: [number, number, number] = [240, 253, 250]; // emerald-50
  let colorBorder: [number, number, number] = [204, 251, 241]; // emerald-100
  let headerColor = COLORS.emerald;
  let recommendation = "El sistema opera dentro de los estándares esperados. No se requieren acciones correctivas inmediatas.";
  
  const reasons = [];

  if (successRate < 95 || avgLatency > 400) {
    title = "DIAGNÓSTICO CRÍTICO";
    colorBg = [254, 242, 242]; // red-50
    colorBorder = [254, 202, 202]; // red-200
    headerColor = COLORS.orange; 
    
    if (successRate < 95) reasons.push("Tasa de éxito insuficiente (<95%). Revisar logs de errores 5xx en backend.");
    if (avgLatency > 400) reasons.push("Latencia crítica (>400ms). Verificar cuellos de botella en BBDD, carga de CPU o dependencias externas.");
  } else if (successRate < 99 || avgLatency > 150) {
    title = "DIAGNÓSTICO ACEPTABLE (OPTIMIZABLE)";
    colorBg = [255, 251, 235]; // amber-50
    colorBorder = [254, 243, 199]; // amber-200
    headerColor = COLORS.orange;

    if (successRate < 99) reasons.push("Errores esporádicos detectados. Revisar integridad de peticiones.");
    if (avgLatency > 150) reasons.push("Latencia mejorable. Considerar implementación de caché o optimización de consultas.");
  }

  // Integrar el punto de ruptura si existe
  if (rawLogs) {
      const tippingPoint = detectFailureTippingPoint(rawLogs);
      if (tippingPoint) reasons.push(tippingPoint);
  }

  if (reasons.length > 0) {
    recommendation = `ACCIÓN REQUERIDA: ${reasons.join(" ")}`;
  }
  
  const analysis = `Análisis Técnico: La latencia promedio es de ${avgLatency.toFixed(2)}ms. El percentil P95 (${p95.toFixed(2)}ms) indica que el 95% de las peticiones fueron más rápidas que este valor, filtrando picos atípicos. El percentil P99 (${p99.toFixed(2)}ms) representa el escenario crítico del 1% de peticiones más lentas, ideal para identificar bloqueos de I/O o congestión.

Recomendación: ${recommendation}`;
  
  return { title, analysis, colorBg, colorBorder, headerColor };
};

// Dibujar encabezado premium
const drawPremiumHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  // Fondo oscuro del header
  doc.setFillColor(...COLORS.navy as [number, number, number]);
  doc.rect(0, 0, 210, 42, 'F');
  
  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(title, 14, 18);
  
  // Subtítulo (ej. URL del endpoint)
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(186, 230, 253); // color azul cielo claro
    const wrappedSubtitle = doc.splitTextToSize(subtitle, 182);
    doc.text(wrappedSubtitle, 14, 27);
  }

  // Línea decorativa verde al fondo del header
  doc.setFillColor(...COLORS.emerald as [number, number, number]);
  doc.rect(0, 40, 210, 2, 'F');
};

// Dibujar contenedor/caja estilizada con cabecera de color
const drawStyledCard = (
  doc: jsPDF, 
  x: number, 
  y: number, 
  w: number, 
  title: string, 
  content: string, 
  headerColor: [number, number, number], 
  bodyBgColor: [number, number, number]
): number => {
  const lines = doc.splitTextToSize(content, w - 8);
  const lineCount = lines.length;
  const cardH = (lineCount * 4) + 14;

  // Dibujar cuerpo de la tarjeta
  doc.setFillColor(...bodyBgColor);
  doc.setDrawColor(...COLORS.border as [number, number, number]);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, cardH, 2, 2, 'FD');

  // Cabecera superior de color
  doc.setFillColor(...headerColor);
  doc.rect(x, y, w, 7, 'F');

  // Texto cabecera
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(title.toUpperCase(), x + 3, y + 4.8);

  // Texto contenido (tipo código)
  doc.setTextColor(...COLORS.textDark as [number, number, number]);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  
  // Imprimir líneas de texto
  for (let i = 0; i < lineCount; i++) {
    doc.text(lines[i], x + 4, y + 12 + (i * 4));
  }

  return y + cardH + 6; // Retorna la siguiente coordenada y libre
};

// Agregar marca de agua y pie de página
const addFooterAndWatermark = (doc: jsPDF, watermarkText: string) => {
  const pageCount = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Marca de agua
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(50);
    doc.setFont("helvetica", "bold");
    doc.text(watermarkText, 105, 145, { angle: 45, align: 'center' });
    doc.restoreGraphicsState();

    // Pie de página
    doc.setDrawColor(...COLORS.border as [number, number, number]);
    doc.setLineWidth(0.2);
    doc.line(14, 282, 196, 282);

    doc.setTextColor(...COLORS.textLight as [number, number, number]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("StressForge — Reporte Técnico Automatizado", 14, 288);
    doc.text(`Página ${i} de ${pageCount}`, 196, 288, { align: 'right' });
  }
};

/**
 * Reporte detallado de un Endpoint individual
 */
export const generateEndpointPDF = (ep: any) => {
  const doc = new jsPDF();
  
  // Petición y datos básicos
  const url = ep.endpoint || "N/A";
  const method = ep.method || "GET";
  const statusStr = (ep.status || "idle").toUpperCase();
  const successCount = ep.successCount || 0;
  const failCount = ep.failCount || 0;
  const total = ep.totalReqs || (successCount + failCount) || 0;
  
  // Resolver latencia y percentiles
  let avgLatencyVal = 0;
  let p50Val = ep.p50 || 0;
  let p95Val = ep.p95 || 0;
  let p99Val = ep.p99 || 0;

  if (typeof ep.latency === 'object' && ep.latency !== null) {
    avgLatencyVal = ep.latency.avg || 0;
    p50Val = ep.latency.p50 || p50Val || ep.latency.avg || 0;
    p95Val = ep.latency.p95 || p95Val || (p50Val * 1.3);
    p99Val = ep.latency.p99 || p99Val || (p50Val * 1.7);
  } else if (typeof ep.latency === 'number') {
    avgLatencyVal = ep.latency;
    p50Val = p50Val || ep.latency;
    p95Val = p95Val || (ep.latency * 1.3);
    p99Val = p99Val || (ep.latency * 1.7);
  }

  const successRate = total ? Math.round((successCount / total) * 100) : 100;
  const duration = ep.configSnapshot?.duration || 1;
  const rps = duration > 0 ? (total / duration) : 0;
  const headersCount = ep.headers ? Object.keys(ep.headers).length : 0;

  // --- PÁGINA 1: DATOS GENERALES Y TABLAS ---
  drawPremiumHeader(doc, "Detalle de Endpoint", `${method} — ${url}`);
  
  let y = 52;

  // 1. Sección: Métricas de Rendimiento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy as [number, number, number]);
  doc.text("Métricas de Rendimiento", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65, textColor: COLORS.textDark },
      1: { textColor: COLORS.textLight }
    },
    body: [
      ["Método HTTP", method],
      ["Estado de Prueba", statusStr === "SUCCESS" ? "EXITOSO (OK)" : statusStr],
      ["Latencia Promedio", `${avgLatencyVal.toFixed(2)} ms`],
      ["Tasa de Éxito", `${successRate}%`],
      ["Solicitudes Totales", `${total.toLocaleString()}`],
      ["Throughput (RPS)", `${rps.toFixed(2)} req/s`],
      ["Duración de Carga", `${duration} s`],
      ["Headers Enviados", `${headersCount} headers`],
      ["Payload Body", ep.requestBody ? "Presente (ver Pág 2)" : "No hay body"],
    ],
    headStyles: { fillColor: COLORS.navy as any }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // 2. Sección: Estadísticas por Etiqueta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy as [number, number, number]);
  doc.text("Estadísticas por Etiqueta", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: COLORS.emerald as any, fontStyle: 'bold' },
    head: [['Etiqueta / URL', 'Status', 'Success Rate', 'Avg RT']],
    body: [
      [url, statusStr.toLowerCase(), `${successRate}%`, `${(avgLatencyVal / 1000).toFixed(3)}s`]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // 3. Sección: Análisis de Percentiles (ms)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy as [number, number, number]);
  doc.text("Análisis de Percentiles", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: COLORS.purple as any, fontStyle: 'bold' },
    head: [['Percentil', 'Valor de Latencia (ms)']],
    body: [
      ["P50 (Mediana)", `${p50Val.toFixed(2)} ms`],
      ["P95 (Límite Crítico)", `${p95Val.toFixed(2)} ms`],
      ["P99 (Picos Extremos)", `${p99Val.toFixed(2)} ms`]
    ]
  });

  // --- PÁGINA 2: ANÁLISIS DESCRIPTIVO Y CONTENIDO TÉCNICO ---
  doc.addPage();
  drawPremiumHeader(doc, "Análisis Técnico y Payloads", `${method} — ${url}`);
  
  y = 52;

  // 4. Narrativa de Análisis de Rendimiento
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy as [number, number, number]);
  doc.text("Análisis de Rendimiento y Diagnóstico", 14, y);
  y += 4;

  const diag = getDiagnostic(successRate, avgLatencyVal, p95Val, p99Val, ep.logs);
  
  let detailedAnalysis = `Se realizó una prueba de carga sobre ${url} (${method}). `;
  if (successRate === 100) {
    detailedAnalysis += `Tasa de éxito del 100%. El sistema respondió correctamente sin errores HTTP detectados. `;
  } else {
    detailedAnalysis += `Tasa de éxito del ${successRate}%. Se detectaron errores transitorios que impactan la fiabilidad bajo carga. `;
  }
  detailedAnalysis += diag.analysis;
  
  y = drawStyledCard(doc, 14, y, 182, diag.title, detailedAnalysis, diag.headerColor, diag.colorBg);
  y += 4;

  // 5. Cajas técnicas de Headers, Payload y Respuesta
  const headersStr = safeFormatJSON(ep.headers || {});
  const payloadStr = safeFormatJSON(ep.requestBody || "No hay body");
  const responseStr = safeFormatJSON(ep.responseBody || "N/A");

  // Headers (Azul)
  y = drawStyledCard(doc, 14, y, 182, "Headers Enviados", headersStr, COLORS.blue, [240, 249, 255] as [number, number, number]); // bg azul cielo claro

  // Verificar si hay espacio suficiente para las siguientes cajas, si no, crear nueva página
  if (y > 210) {
    doc.addPage();
    drawPremiumHeader(doc, "Detalles de Datos (Continuación)", `${method} — ${url}`);
    y = 52;
  }

  // Payload (Naranja)
  y = drawStyledCard(doc, 14, y, 182, "Payload Body", payloadStr, COLORS.orange, [254, 243, 199] as [number, number, number]); // bg naranja/amarillo claro

  if (y > 210) {
    doc.addPage();
    drawPremiumHeader(doc, "Detalles de Datos (Respuesta)", `${method} — ${url}`);
    y = 52;
  }

  // Respuesta (Verde)
  y = drawStyledCard(doc, 14, y, 182, "Respuesta Recibida", responseStr, COLORS.emerald, [240, 253, 250] as [number, number, number]); // bg verde claro

  // Aplicar marcas de agua y numeración de página
  addFooterAndWatermark(doc, "STRESSFORGE");
  
  // Guardar archivo
  const safeFilename = url.replace(/https?:\/\//g, '').replace(/[^a-z0-9]/gi, '_');
  doc.save(`reporte_${method}_${safeFilename}.pdf`);
};

/**
 * Reporte General del Dashboard (Todos los Endpoints)
 */
export const generatePDF = (reportData: any) => {
  const doc = new jsPDF();
  
  const toolName = (reportData.tool || "StressForge").toUpperCase();
  const totalEndpoints = reportData.totalEndpoints || 0;
  const overallAvg = typeof reportData.overallAvgLatency === 'object' 
    ? reportData.overallAvgLatency.avg || 0 
    : reportData.overallAvgLatency || 0;
  const overallSuccess = reportData.overallSuccessRate || 0;
  const totalRequests = reportData.totalRequests || 0;

  // --- PÁGINA 1 ---
  drawPremiumHeader(doc, "Reporte General de Rendimiento", `Tecnología Activa: ${toolName}`);
  
  let y = 52;

  // 1. Resumen Ejecutivo (Tabla)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy as [number, number, number]);
  doc.text("Resumen Ejecutivo de Carga", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    styles: { fontSize: 9.5, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 75, textColor: COLORS.textDark },
      1: { textColor: COLORS.textLight }
    },
    body: [
      ["Total de Endpoints Evaluados", totalEndpoints],
      ["Latencia Promedio Global", `${overallAvg.toFixed(2)} ms`],
      ["Tasa de Éxito Promedio", `${overallSuccess.toFixed(2)}%`],
      ["Total General de Peticiones", totalRequests.toLocaleString()],
      ["Fecha de Generación", new Date().toLocaleString("es-ES")],
    ],
    headStyles: { fillColor: COLORS.navy as any }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // 2. Conclusión Narrativa Global
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy as [number, number, number]);
  doc.text("Evaluación Global del Sistema", 14, y);
  y += 4;

  const p95 = reportData.percentiles?.P95 || overallAvg * 1.3;
  const p99 = reportData.percentiles?.P99 || overallAvg * 1.7;

  const diag = getDiagnostic(overallSuccess, overallAvg, p95, p99, reportData.logs);
  
  let globalNarrative = `Este reporte consolida el comportamiento general de ${totalEndpoints} endpoints sometidos a estrés con ${toolName}. `;
  globalNarrative += diag.analysis;
  
  y = drawStyledCard(doc, 14, y, 182, diag.title, globalNarrative, diag.headerColor, diag.colorBg);
  y += 4;

  // 3. Tabla Desglosada de Endpoints
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy as [number, number, number]);
  doc.text("Detalle Desglosado por Endpoint", 14, y);
  y += 4;

  const endpointsBody = (reportData.endpoints || []).map((e: any) => {
    const lat = typeof e.latency === 'number' ? e.latency : (e.latency?.avg || 0);
    const rate = e.successRate || (e.totalReqs ? Math.round(((e.successCount || 0) / e.totalReqs) * 100) : 100);
    const hasConfig = (e.headers ? "H" : "") + (e.requestBody || e.body ? "B" : "");
    return [
      e.method || "GET",
      e.endpoint || "N/A",
      `${lat.toFixed(2)} ms`,
      `${rate}%`,
      hasConfig || "-",
      (e.status || "idle").toUpperCase()
    ];
  });

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: COLORS.blue as any, fontStyle: 'bold' },
    head: [['Método', 'Endpoint / URI', 'Latencia', 'Éxito', 'Config', 'Estado']],
    body: endpointsBody.length > 0 ? endpointsBody : [["-", "Sin endpoints probados", "-", "-", "-", "-"]]
  });

  // --- PÁGINA 2: REGISTRO DE LOGS ---
  if (reportData.logs) {
    // Dividir el texto en líneas que caben en el ancho de la tarjeta para paginar correctamente
    const allVisualLines = doc.splitTextToSize(reportData.logs, 174);
    const linesPerPage = 40; 
    let pageLogIndex = 0;

    for (let i = 0; i < allVisualLines.length; i += linesPerPage) {
      doc.addPage();
      drawPremiumHeader(doc, "Registro Técnico de Ejecución", "Logs Crudos de la Sesión");
      
      const chunkLines = allVisualLines.slice(i, i + linesPerPage);
      const chunk = chunkLines.join('\n');
      
      const y = 52;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.navy as [number, number, number]);
      doc.text(`Extracto de Consola (Parte ${++pageLogIndex})`, 14, y);
      
      drawStyledCard(doc, 14, y + 4, 182, "Logs de stressforge", chunk, COLORS.navy, COLORS.slateBg);
    }
  }

  // Marcas de agua y paginación
  addFooterAndWatermark(doc, "STRESSFORGE");
  
  // Guardar archivo
  doc.save(`reporte_global_${new Date().toISOString().slice(0, 10)}.pdf`);
};
