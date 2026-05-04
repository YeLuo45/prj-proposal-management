import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export an HTML element to PNG using html2canvas
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} filename - Output filename (without extension)
 * @param {object} options - html2canvas options
 * @returns {Promise<void>}
 */
export async function exportToPNG(element, filename = 'export', options = {}) {
  if (!element) {
    throw new Error('No element provided for export');
  }

  const defaultOptions = {
    useCORS: true,
    allowTaint: true,
    scale: 2, // Higher quality
    backgroundColor: '#ffffff',
    logging: false,
    ...options,
  };

  // Temporarily increase image quality if dark mode
  const isDark = document.documentElement.classList.contains('dark') || 
                 document.documentElement.classList.contains('theme-dark') ||
                 document.documentElement.classList.contains('theme-forest') ||
                 document.documentElement.classList.contains('theme-sunset');
  
  if (isDark) {
    defaultOptions.backgroundColor = '#1f2937'; // gray-800
  }

  const canvas = await html2canvas(element, defaultOptions);
  
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/**
 * Export an HTML element to PDF using html2canvas + jsPDF
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} filename - Output filename (without extension)
 * @param {string} orientation - 'portrait' or 'landscape'
 * @param {object} options - html2canvas options
 * @returns {Promise<void>}
 */
export async function exportToPDF(element, filename = 'export', orientation = 'portrait', options = {}) {
  if (!element) {
    throw new Error('No element provided for export');
  }

  const defaultOptions = {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    ...options,
  };

  // Detect dark theme
  const isDark = document.documentElement.classList.contains('dark') || 
                 document.documentElement.classList.contains('theme-dark') ||
                 document.documentElement.classList.contains('theme-forest') ||
                 document.documentElement.classList.contains('theme-sunset');
  
  if (isDark) {
    defaultOptions.backgroundColor = '#1f2937';
  }

  const canvas = await html2canvas(element, defaultOptions);
  const imgData = canvas.toDataURL('image/png', 1.0);
  
  // Calculate PDF dimensions based on canvas aspect ratio
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  // A4 dimensions in points
  const pageWidth = orientation === 'portrait' ? 595.28 : 841.89;
  const pageHeight = orientation === 'portrait' ? 841.89 : 595.28;
  
  // Calculate ratio to fit image on page
  const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
  const pdfWidth = imgWidth * ratio;
  const pdfHeight = imgHeight * ratio;
  
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  // Center the image on the page
  const xOffset = (pageWidth - pdfWidth) / 2;
  const yOffset = 0;

  pdf.addImage(imgData, 'PNG', xOffset, yOffset, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
}

/**
 * Export table data to CSV
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column definitions { key, header }
 * @param {string} filename - Output filename
 */
export function exportToCSV(data, columns, filename = 'export') {
  if (!data || !data.length) return;
  
  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(item => 
    columns.map(col => {
      const val = item[col.key];
      // Escape commas and quotes
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default { exportToPNG, exportToPDF, exportToCSV };
