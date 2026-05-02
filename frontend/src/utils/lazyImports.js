/**
 * Lazy Import Utilities
 * 
 * This file provides utility functions for dynamically importing heavy libraries
 * only when they are actually needed, reducing initial bundle size.
 */

// ============================================================================
// XLSX (Excel) Library - ~850KB
// ============================================================================
let xlsxModule = null;

export async function loadXLSX() {
  if (xlsxModule) return xlsxModule;
  
  try {
    xlsxModule = await import('xlsx');
    console.log('[Performance] XLSX library loaded on-demand');
    return xlsxModule;
  } catch (error) {
    console.error('[Performance] Failed to load XLSX library:', error);
    throw new Error('Failed to load Excel export functionality');
  }
}

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export async function exportToExcel(data, filename = 'export') {
  const XLSX = await loadXLSX();
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ============================================================================
// jsPDF Library - ~670KB
// ============================================================================
let jsPDFModule = null;
let html2canvasModule = null;

export async function loadPDFLibraries() {
  if (jsPDFModule && html2canvasModule) {
    return { jsPDF: jsPDFModule, html2canvas: html2canvasModule };
  }
  
  try {
    const [jsPDF, html2canvas] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    
    jsPDFModule = jsPDF.default || jsPDF;
    html2canvasModule = html2canvas.default || html2canvas;
    
    console.log('[Performance] PDF libraries loaded on-demand');
    return { jsPDF: jsPDFModule, html2canvas: html2canvasModule };
  } catch (error) {
    console.error('[Performance] Failed to load PDF libraries:', error);
    throw new Error('Failed to load PDF export functionality');
  }
}

/**
 * Export HTML element to PDF
 * @param {HTMLElement} element - DOM element to export
 * @param {string} filename - Name of the PDF file (without extension)
 * @param {Object} options - PDF options
 */
export async function exportToPDF(element, filename = 'document', options = {}) {
  const { jsPDF, html2canvas } = await loadPDFLibraries();
  
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    ...options.html2canvasOptions,
  });
  
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: options.orientation || 'portrait',
    unit: 'mm',
    format: options.format || 'a4',
  });
  
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(`${filename}.pdf`);
}

// ============================================================================
// Recharts Library - ~1.1MB
// ============================================================================
let rechartsModule = null;

export async function loadRecharts() {
  if (rechartsModule) return rechartsModule;
  
  try {
    rechartsModule = await import('recharts');
    console.log('[Performance] Recharts library loaded on-demand');
    return rechartsModule;
  } catch (error) {
    console.error('[Performance] Failed to load Recharts library:', error);
    throw new Error('Failed to load chart functionality');
  }
}

/**
 * Get specific Recharts components
 * Usage: const { LineChart, Line, XAxis, YAxis } = await getRechartsComponents();
 */
export async function getRechartsComponents() {
  return await loadRecharts();
}

// ============================================================================
// Socket.io Client - ~200KB
// ============================================================================
let socketIOModule = null;

export async function loadSocketIO() {
  if (socketIOModule) return socketIOModule;
  
  try {
    socketIOModule = await import('socket.io-client');
    console.log('[Performance] Socket.IO library loaded on-demand');
    return socketIOModule;
  } catch (error) {
    console.error('[Performance] Failed to load Socket.IO library:', error);
    throw new Error('Failed to load real-time functionality');
  }
}

// ============================================================================
// Utility: Check if library is loaded
// ============================================================================
export function isLibraryLoaded(libraryName) {
  switch (libraryName) {
    case 'xlsx':
      return xlsxModule !== null;
    case 'jspdf':
      return jsPDFModule !== null && html2canvasModule !== null;
    case 'recharts':
      return rechartsModule !== null;
    case 'socket.io':
      return socketIOModule !== null;
    default:
      return false;
  }
}

// ============================================================================
// Utility: Preload library (for better UX)
// ============================================================================
export async function preloadLibrary(libraryName) {
  try {
    switch (libraryName) {
      case 'xlsx':
        await loadXLSX();
        break;
      case 'jspdf':
        await loadPDFLibraries();
        break;
      case 'recharts':
        await loadRecharts();
        break;
      case 'socket.io':
        await loadSocketIO();
        break;
      default:
        console.warn(`[Performance] Unknown library: ${libraryName}`);
    }
  } catch (error) {
    console.error(`[Performance] Failed to preload ${libraryName}:`, error);
  }
}

// ============================================================================
// Export all utilities
// ============================================================================
export default {
  loadXLSX,
  exportToExcel,
  loadPDFLibraries,
  exportToPDF,
  loadRecharts,
  getRechartsComponents,
  loadSocketIO,
  isLibraryLoaded,
  preloadLibrary,
};
