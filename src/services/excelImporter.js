/**
 * Excel Importer Service - V28 Enhanced Data Import
 * Supports .xlsx and .xls formats with validation and preview
 */

import * as XLSX from 'xlsx';

/**
 * Parse Excel file to JSON data
 * @param {File} file - Excel file object
 * @returns {Promise<{ headers: string[], rows: object[], sheetNames: string[] }>}
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const sheetNames = workbook.SheetNames;
        const firstSheet = workbook.Sheets[sheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        
        if (jsonData.length < 2) {
          resolve({ headers: [], rows: [], sheetNames });
          return;
        }
        
        // First row as headers
        const headers = jsonData[0].map(h => String(h || '').trim());
        
        // Rest as data rows
        const rows = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const obj = {};
          headers.forEach((h, idx) => {
            const val = row[idx];
            // Handle different value types
            if (val instanceof Date) {
              obj[h] = val.toISOString().split('T')[0];
            } else {
              obj[h] = String(val !== undefined ? val : '').trim();
            }
          });
          rows.push(obj);
        }
        
        resolve({ headers, rows, sheetNames });
      } catch (err) {
        reject(new Error(`Excel解析失败: ${err.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get all sheets from Excel file
 * @param {File} file - Excel file object
 * @returns {Promise<Array<{ name: string, headers: string[], rows: object[] }>>}
 */
export async function getExcelSheets(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const sheets = workbook.SheetNames.map(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          
          if (jsonData.length < 2) {
            return { name: sheetName, headers: [], rows: [] };
          }
          
          const headers = jsonData[0].map(h => String(h || '').trim());
          const rows = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const obj = {};
            headers.forEach((h, idx) => {
              const val = row[idx];
              if (val instanceof Date) {
                obj[h] = val.toISOString().split('T')[0];
              } else {
                obj[h] = String(val !== undefined ? val : '').trim();
              }
            });
            rows.push(obj);
          }
          
          return { name: sheetName, headers, rows };
        });
        
        resolve(sheets);
      } catch (err) {
        reject(new Error(`Excel解析失败: ${err.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detect column mapping between Excel columns and proposal fields
 * @param {string[]} headers - Excel headers
 * @returns {object} - Mapping of proposal fields to column indices
 */
export function detectColumnMapping(headers) {
  const fieldPatterns = {
    id: ['id', '编号', 'proposal id', 'proposal_id'],
    name: ['name', '名称', '标题', 'proposal name', 'title'],
    description: ['description', '描述', '说明', '详情'],
    type: ['type', '类型', 'proposal type'],
    status: ['status', '状态', 'proposal status'],
    projectId: ['projectid', 'project_id', '项目id', '项目编号', 'project'],
    tags: ['tags', '标签', 'keywords', '关键字'],
    milestoneId: ['milestoneid', 'milestone_id', '里程碑id', 'milestone'],
    url: ['url', '链接', '网址', '地址'],
    gitRepo: ['gitrepo', 'git_repo', 'git仓库', '仓库地址'],
    createdAt: ['createdat', 'created_at', '创建时间', '创建日期', '创建日'],
    updatedAt: ['updatedat', 'updated_at', '更新时间', '更新日期', '更新日']
  };
  
  const mapping = {};
  
  headers.forEach((header, idx) => {
    const h = header.toLowerCase();
    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      if (patterns.some(p => h.includes(p))) {
        mapping[field] = idx;
        break;
      }
    }
  });
  
  return mapping;
}

/**
 * Transform Excel rows to proposal format using column mapping
 * @param {object[]} rows - Raw Excel rows
 * @param {object} mapping - Column mapping
 * @returns {object[]} - Proposals array
 */
export function transformExcelRows(rows, mapping) {
  return rows.map((row, idx) => {
    const getVal = (field) => {
      const colIdx = mapping[field];
      if (colIdx === undefined) return '';
      const headers = Object.keys(row);
      if (colIdx >= headers.length) return '';
      return row[headers[colIdx]] || '';
    };
    
    const tagsStr = getVal('tags');
    const tags = tagsStr 
      ? tagsStr.split(/[,，;；|]/).map(t => t.trim()).filter(Boolean)
      : [];
    
    return {
      id: getVal('id') || '',
      name: getVal('name') || '',
      description: getVal('description') || '',
      type: getVal('type') || 'web',
      status: getVal('status') || 'active',
      projectId: getVal('projectId') || '',
      tags,
      milestoneId: getVal('milestoneId') || null,
      url: getVal('url') || '',
      gitRepo: getVal('gitRepo') || '',
      createdAt: getVal('createdAt') || new Date().toISOString().split('T')[0],
      updatedAt: getVal('updatedAt') || new Date().toISOString().split('T')[0]
    };
  });
}

/**
 * Validate Excel import data
 * @param {object[]} proposals - Parsed proposals
 * @param {object[]} existingProjects - Current projects for duplicate check
 * @returns {{ errors: string[], validProposals: object[], existingIds: string[], newIds: string[] }}
 */
export function validateExcelImport(proposals, existingProjects) {
  const errors = [];
  const validProposals = [];
  const existingIds = new Set();
  
  const allProposalIds = new Set();
  existingProjects.forEach(p => {
    p.proposals?.forEach(prop => allProposalIds.add(prop.id));
  });
  
  const validTypes = ['web', 'app', 'package'];
  const validStatuses = ['active', 'in_dev', 'archived'];
  
  proposals.forEach((proposal, idx) => {
    const lineNum = idx + 2;
    const rowErrors = [];
    
    if (!proposal.id) {
      rowErrors.push(`第 ${lineNum} 行：缺少 id`);
    }
    if (!proposal.name) {
      rowErrors.push(`第 ${lineNum} 行：缺少 name`);
    }
    
    if (rowErrors.length === 0) {
      if (proposal.type && !validTypes.includes(proposal.type)) {
        errors.push(`第 ${lineNum} 行：type 值无效「${proposal.type}」`);
      }
      if (proposal.status && !validStatuses.includes(proposal.status)) {
        errors.push(`第 ${lineNum} 行：status 值无效「${proposal.status}」`);
      }
      
      if (errors.length === 0 || !errors[errors.length - 1].startsWith(`第 ${lineNum}`)) {
        validProposals.push(proposal);
        
        if (allProposalIds.has(proposal.id)) {
          existingIds.add(proposal.id);
        }
      }
    } else {
      errors.push(...rowErrors);
    }
  });
  
  const newIds = validProposals
    .filter(p => !existingIds.has(p.id))
    .map(p => p.id);
  
  return {
    errors,
    validProposals,
    existingIds: Array.from(existingIds),
    newIds
  };
}

/**
 * Execute Excel import with mode
 * @param {object[]} validProposals - Valid proposals to import
 * @param {object[]} existingProjects - Current projects
 * @param {'skip' | 'overwrite' | 'new_only'} mode - Import mode
 * @returns {{ projects: object[], imported: number, skipped: number, updated: number }}
 */
export function executeExcelImport(validProposals, existingProjects, mode = 'skip') {
  let imported = 0, skipped = 0, updated = 0;
  
  const projectsMap = new Map(
    existingProjects.map(p => [p.id, { ...p, proposals: [...(p.proposals || [])] }])
  );
  
  validProposals.forEach(proposal => {
    const project = projectsMap.get(proposal.projectId);
    
    if (!project) {
      skipped++;
      return;
    }
    
    const existingIdx = project.proposals.findIndex(p => p.id === proposal.id);
    
    if (existingIdx !== -1) {
      if (mode === 'skip') {
        skipped++;
      } else if (mode === 'overwrite') {
        project.proposals[existingIdx] = {
          ...proposal,
          updatedAt: new Date().toISOString().split('T')[0]
        };
        updated++;
      } else if (mode === 'new_only') {
        proposal.id = generateNewId();
        project.proposals.push({
          ...proposal,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        });
        imported++;
      }
    } else {
      project.proposals.push({
        ...proposal,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      });
      imported++;
    }
  });
  
  return {
    projects: Array.from(projectsMap.values()),
    imported,
    skipped,
    updated
  };
}

function generateNewId() {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `P-${dateStr}-${seq}`;
}

export default {
  parseExcelFile,
  getExcelSheets,
  detectColumnMapping,
  transformExcelRows,
  validateExcelImport,
  executeExcelImport
};
