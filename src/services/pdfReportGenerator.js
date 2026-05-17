/**
 * PDF Report Generator Service - V28 Enhanced Reporting
 * Generates comprehensive PDF reports from proposals data
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Report type configurations
 */
const REPORT_TYPES = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
  PROJECT: 'project',
  MILESTONE: 'milestone',
  STATISTICS: 'statistics'
};

/**
 * Status display configurations
 */
const STATUS_CONFIG = {
  active: { label: 'Active', color: [34, 197, 94], bgColor: [34, 197, 94, 0.1] },
  in_dev: { label: 'In Development', color: [59, 130, 246], bgColor: [59, 130, 246, 0.1] },
  archived: { label: 'Archived', color: [156, 163, 175], bgColor: [156, 163, 175, 0.1] }
};

/**
 * Type display configurations
 */
const TYPE_CONFIG = {
  web: { label: 'Web', color: [139, 92, 246] },
  app: { label: 'App', color: [236, 72, 153] },
  package: { label: 'Package', color: [245, 158, 11] }
};

/**
 * Generate summary statistics for reports
 * @param {object[]} projects - Projects data
 * @returns {object} - Statistics object
 */
export function generateReportStats(projects) {
  const stats = {
    totalProjects: projects.length,
    totalProposals: 0,
    byStatus: { active: 0, in_dev: 0, archived: 0 },
    byType: { web: 0, app: 0, package: 0 },
    recentActivity: []
  };
  
  projects.forEach(project => {
    const proposals = project.proposals || [];
    stats.totalProposals += proposals.length;
    
    proposals.forEach(p => {
      if (stats.byStatus.hasOwnProperty(p.status)) {
        stats.byStatus[p.status]++;
      }
      if (stats.byType.hasOwnProperty(p.type)) {
        stats.byType[p.type]++;
      }
    });
    
    // Get recent updates
    proposals.forEach(p => {
      if (p.updatedAt) {
        stats.recentActivity.push({
          id: p.id,
          name: p.name,
          projectName: project.name,
          updatedAt: p.updatedAt,
          status: p.status
        });
      }
    });
  });
  
  // Sort by updatedAt desc and take top 10
  stats.recentActivity.sort((a, b) => 
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
  stats.recentActivity = stats.recentActivity.slice(0, 10);
  
  return stats;
}

/**
 * Create a basic PDF document with jsPDF
 * @param {string} title - Document title
 * @returns {jsPDF} - PDF document instance
 */
export function createPDFDocument(title = 'Proposals Report') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add title page header
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 40, { align: 'center' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, pageWidth - 20, 45);
  
  return doc;
}

/**
 * Add page header with logo and page number
 * @param {jsPDF} doc - PDF document
 * @param {string} title - Page title
 * @param {number} pageNum - Current page number
 */
function addPageHeader(doc, title, pageNum) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 15);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${pageNum}`, pageWidth - 20, 15, { align: 'right' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 18, pageWidth - 20, 18);
}

/**
 * Generate summary report PDF
 * @param {object[]} projects - Projects data
 * @param {string} filename - Output filename
 */
export function generateSummaryReport(projects, filename = 'proposals-summary') {
  const doc = createPDFDocument('Proposals Summary Report');
  const stats = generateReportStats(projects);
  let yPos = 55;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Overview Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Overview', margin, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const overviewData = [
    ['Total Projects', String(stats.totalProjects)],
    ['Total Proposals', String(stats.totalProposals)],
    ['Active', String(stats.byStatus.active)],
    ['In Development', String(stats.byStatus.in_dev)],
    ['Archived', String(stats.byStatus.archived)]
  ];
  
  overviewData.forEach(([label, value]) => {
    doc.text(`${label}:`, margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 50, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 7;
  });
  
  yPos += 10;
  
  // By Type Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Proposals by Type', margin, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const typeData = [
    ['Web Applications', String(stats.byType.web)],
    ['Mobile Apps', String(stats.byType.app)],
    ['Packages', String(stats.byType.package)]
  ];
  
  typeData.forEach(([label, value]) => {
    doc.text(`${label}:`, margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 50, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 7;
  });
  
  // New page for recent activity
  doc.addPage();
  addPageHeader(doc, 'Recent Activity', 2);
  yPos = 30;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Proposal Updates', margin, yPos);
  yPos += 10;
  
  // Table header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
  
  doc.text('ID', margin + 2, yPos);
  doc.text('Name', margin + 30, yPos);
  doc.text('Project', margin + 90, yPos);
  doc.text('Status', margin + 140, yPos);
  doc.text('Updated', margin + 170, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  
  stats.recentActivity.forEach((item, idx) => {
    if (yPos > 270) {
      doc.addPage();
      addPageHeader(doc, 'Recent Activity (cont.)', 3);
      yPos = 30;
    }
    
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 7, 'F');
    }
    
    doc.text(item.id.substring(0, 15), margin + 2, yPos);
    doc.text(item.name.substring(0, 30), margin + 30, yPos);
    doc.text(item.projectName.substring(0, 25), margin + 90, yPos);
    doc.text(item.status, margin + 140, yPos);
    doc.text(item.updatedAt, margin + 170, yPos);
    
    yPos += 7;
  });
  
  doc.save(`${filename}.pdf`);
}

/**
 * Generate detailed project report PDF
 * @param {object} project - Project object
 * @param {object[]} milestones - Related milestones
 * @param {string} filename - Output filename
 */
export function generateProjectReport(project, milestones = [], filename = 'project-report') {
  const doc = createPDFDocument(`Project: ${project.name}`);
  let yPos = 55;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Project Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Information', margin, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const projectInfo = [
    ['ID', project.id],
    ['Name', project.name],
    ['Description', project.description || 'N/A'],
    ['URL', project.prj_url || 'N/A'],
    ['Git Repository', project.gitRepo || 'N/A'],
    ['Created', project.createdAt],
    ['Updated', project.updatedAt]
  ];
  
  projectInfo.forEach(([label, value]) => {
    doc.text(`${label}:`, margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value).substring(0, 60), margin + 25, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 6;
  });
  
  yPos += 10;
  
  // Proposals Section
  const proposals = project.proposals || [];
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Proposals (${proposals.length})`, margin, yPos);
  yPos += 8;
  
  proposals.forEach((proposal, idx) => {
    if (yPos > 260) {
      doc.addPage();
      addPageHeader(doc, `Project: ${project.name}`, doc.internal.getNumberOfPages());
      yPos = 30;
    }
    
    // Proposal card
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 25, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}. ${proposal.name}`, margin + 3, yPos + 2);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const statusLabel = STATUS_CONFIG[proposal.status]?.label || proposal.status;
    const typeLabel = TYPE_CONFIG[proposal.type]?.label || proposal.type;
    
    doc.text(`ID: ${proposal.id}`, margin + 3, yPos + 8);
    doc.text(`Type: ${typeLabel}`, margin + 60, yPos + 8);
    doc.text(`Status: ${statusLabel}`, margin + 100, yPos + 8);
    
    if (proposal.tags && proposal.tags.length > 0) {
      doc.text(`Tags: ${proposal.tags.join(', ')}`, margin + 3, yPos + 14);
    }
    
    doc.text(`Updated: ${proposal.updatedAt}`, margin + 3, yPos + 20);
    
    yPos += 30;
  });
  
  // Milestones Section if exists
  if (milestones.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      addPageHeader(doc, `Project: ${project.name}`, doc.internal.getNumberOfPages());
      yPos = 30;
    }
    
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Milestones (${milestones.length})`, margin, yPos);
    yPos += 8;
    
    milestones.forEach((ms, idx) => {
      if (yPos > 260) {
        doc.addPage();
        addPageHeader(doc, `Project: ${project.name}`, doc.internal.getNumberOfPages());
        yPos = 30;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${idx + 1}. ${ms.name}`, margin + 3, yPos);
      doc.text(`[${ms.status}]`, margin + 100, yPos);
      doc.text(`${ms.startDate} - ${ms.endDate}`, margin + 130, yPos);
      doc.text(`Progress: ${ms.progress}%`, margin + 180, yPos);
      
      yPos += 8;
    });
  }
  
  doc.save(`${filename}.pdf`);
}

/**
 * Generate statistics chart as image and add to PDF
 * @param {object[]} projects - Projects data
 * @param {jsPDF} doc - PDF document
 * @param {number} startY - Starting Y position
 * @returns {number} - Final Y position after chart
 */
export async function addStatisticsChartToPDF(projects, doc, startY = 50) {
  const stats = generateReportStats(projects);
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const chartWidth = pageWidth - 2 * margin;
  const chartHeight = 40;
  
  // Status distribution bar
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Status Distribution', margin, yPos);
  yPos += 8;
  
  const total = stats.totalProposals || 1;
  let xPos = margin;
  
  const statusColors = {
    active: [34, 197, 94],
    in_dev: [59, 130, 246],
    archived: [156, 163, 175]
  };
  
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    const width = (count / total) * chartWidth;
    if (width > 0) {
      const color = statusColors[status] || [100, 100, 100];
      doc.setFillColor(...color);
      doc.rect(xPos, yPos, width, chartHeight / 3, 'F');
      xPos += width;
    }
  });
  
  yPos += chartHeight / 3 + 5;
  
  // Legend
  xPos = margin;
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    const color = statusColors[status] || [100, 100, 100];
    doc.setFillColor(...color);
    doc.rect(xPos, yPos, 5, 5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${status}: ${count}`, xPos + 8, yPos + 4);
    xPos += 50;
  });
  
  yPos += 15;
  
  // Type distribution bar
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Type Distribution', margin, yPos);
  yPos += 8;
  
  xPos = margin;
  const typeColors = {
    web: [139, 92, 246],
    app: [236, 72, 153],
    package: [245, 158, 11]
  };
  
  Object.entries(stats.byType).forEach(([type, count]) => {
    const width = (count / total) * chartWidth;
    if (width > 0) {
      const color = typeColors[type] || [100, 100, 100];
      doc.setFillColor(...color);
      doc.rect(xPos, yPos, width, chartHeight / 3, 'F');
      xPos += width;
    }
  });
  
  yPos += chartHeight / 3 + 5;
  
  // Legend
  xPos = margin;
  Object.entries(stats.byType).forEach(([type, count]) => {
    const color = typeColors[type] || [100, 100, 100];
    doc.setFillColor(...color);
    doc.rect(xPos, yPos, 5, 5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${type}: ${count}`, xPos + 8, yPos + 4);
    xPos += 50;
  });
  
  return yPos + 10;
}

/**
 * Export DOM element to PDF
 * @param {HTMLElement} element - DOM element to capture
 * @param {string} filename - Output filename
 * @param {string} title - Document title
 */
export async function exportElementToPDF(element, filename = 'report', title = 'Report') {
  if (!element) {
    throw new Error('No element provided for export');
  }
  
  const canvas = await html2canvas(element, {
    useCORS: true,
    allowTaint: true,
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false
  });
  
  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [canvas.width / 2, canvas.height / 2]
  });
  
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`${filename}.pdf`);
}

/**
 * Generate full proposals report with all projects
 * @param {object[]} projects - Projects data
 * @param {object[]} milestones - Milestones data
 * @param {string} filename - Output filename
 */
export function generateFullReport(projects, milestones = [], filename = 'proposals-full-report') {
  const doc = createPDFDocument('Proposals Full Report');
  let pageNum = 1;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Page 1: Cover with stats
  addPageHeader(doc, 'Summary', pageNum);
  
  let yPos = 35;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', margin, yPos);
  yPos += 12;
  
  const stats = generateReportStats(projects);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Stats boxes
  const boxWidth = 50;
  const boxHeight = 25;
  const boxSpacing = 5;
  
  // Total box
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, boxWidth, boxHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(String(stats.totalProjects), margin + boxWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Projects', margin + boxWidth / 2, yPos + 20, { align: 'center' });
  
  // Proposals box
  doc.setFillColor(240, 240, 240);
  doc.rect(margin + boxWidth + boxSpacing, yPos, boxWidth, boxHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(String(stats.totalProposals), margin + boxWidth + boxSpacing + boxWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Proposals', margin + boxWidth + boxSpacing + boxWidth / 2, yPos + 20, { align: 'center' });
  
  yPos += boxHeight + 15;
  
  // Projects detail
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Projects Detail', margin, yPos);
  yPos += 10;
  
  projects.forEach((project, idx) => {
    if (yPos > 260) {
      doc.addPage();
      pageNum++;
      addPageHeader(doc, 'Projects Detail', pageNum);
      yPos = 30;
    }
    
    const proposals = project.proposals || [];
    const activeCount = proposals.filter(p => p.status === 'active').length;
    const devCount = proposals.filter(p => p.status === 'in_dev').length;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}. ${project.name}`, margin, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${proposals.length} proposals (${activeCount} active, ${devCount} in dev)`, margin + 5, yPos);
    yPos += 8;
  });
  
  // Save PDF
  doc.save(`${filename}.pdf`);
}

export default {
  REPORT_TYPES,
  STATUS_CONFIG,
  TYPE_CONFIG,
  generateReportStats,
  createPDFDocument,
  generateSummaryReport,
  generateProjectReport,
  addStatisticsChartToPDF,
  exportElementToPDF,
  generateFullReport
};
