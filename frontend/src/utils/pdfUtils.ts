import jsPDF from 'jspdf';

export const COLORS = {
  navy: [15, 23, 42],
  blue: [59, 130, 246],
  emerald: [16, 185, 129],
  slate: [241, 245, 249],
  text: [30, 41, 59]
};

export const drawHeader = (doc: jsPDF, title: string) => {
    doc.setFillColor(...COLORS.navy as [number, number, number]);
    doc.rect(0, 0, 210, 35, 'F');
    // Placeholder logo (Blue square)
    doc.setFillColor(...COLORS.blue as [number, number, number]);
    doc.rect(15, 7, 20, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("STRESSFORGE // SECSUITE", 40, 17);
    doc.setFontSize(12);
    doc.text(title, 40, 25);
};

export const drawRobustBox = (doc: jsPDF, x: number, y: number, w: number, title: string, content: string | string[]) => {
    const lines = doc.splitTextToSize(typeof content === 'string' ? content : content.join('\n'), w - 8);
    const boxH = (lines.length * 4.5) + 18;
    
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.roundedRect(x, y, w, boxH, 2, 2, 'FD');
    
    // Header
    doc.setFillColor(...COLORS.navy as [number, number, number]);
    doc.rect(x, y, w, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), x + 3, y + 5.5);
    
    // Content
    doc.setTextColor(...COLORS.text as [number, number, number]);
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.text(lines, x + 4, y + 14);
    
    return y + boxH + 8;
};

export const addWatermark = (doc: jsPDF, text: string) => {
    const pages = doc.getNumberOfPages();
    for(let i=1; i<=pages; i++) {
        doc.setPage(i);
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(60);
        doc.text(text, 105, 150, { angle: 45, align: 'center' });
    }
};
