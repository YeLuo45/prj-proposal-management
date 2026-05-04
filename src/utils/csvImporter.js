/**
 * CSV Importer Service - V28 Enhanced Data Import
 * Handles CSV file parsing, validation and import execution
 */

/**
 * Parse CSV text to headers and rows (no external dependencies)
 * @param {string} text - CSV raw text
 * @returns {{ headers: string[], rows: object[] }}
 */
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (values[idx] || '').trim();
    });
    rows.push(obj);
  }
  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted fields
 * @param {string} line - CSV line
 * @returns {string[]} - Parsed values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Read CSV file and return parsed data
 * @param {File} file - CSV File object
 * @returns {Promise<{ headers: string[], rows: object[], filename: string }>}
 */
export async function readCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const { headers, rows } = parseCSV(text);
        resolve({ headers, rows, filename: file.name });
      } catch (err) {
        reject(new Error(`CSV parsing failed: ${err.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsText(file);
  });
}

/**
 * Detect column mapping between CSV headers and proposal fields
 * @param {string[]} headers - CSV headers
 * @returns {object} - Mapping of proposal fields to column indices
 */
export function detectCSVColumnMapping(headers) {
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
 * Transform CSV rows to proposal format using column mapping
 * @param {object[]} rows - Raw CSV rows
 * @param {object} mapping - Column mapping
 * @returns {object[]} - Proposals array
 */
export function transformCSVRows(rows, mapping) {
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
 * Validate CSV import rows
 * @param {object[]} rows - Parsed CSV rows
 * @param {object[]} existingProjects - Current projects (for duplicate check)
 * @returns {{ errors: string[], validRows: object[], existingIds: string[], newIds: string[] }}
 */
export function validateCSVImport(rows, existingProjects) {
  const errors = [];
  const validRows = [];
  const existingIds = new Set();

  const allProposalIds = new Set();
  existingProjects.forEach(p => {
    p.proposals?.forEach(proposal => allProposalIds.add(proposal.id));
  });

  const validTypes = ['web', 'app', 'package'];
  const validStatuses = ['active', 'in_dev', 'archived'];

  rows.forEach((row, idx) => {
    const lineNum = idx + 2;
    const rowErrors = [];

    if (!row.id) rowErrors.push(`Line ${lineNum}: Missing id`);
    if (!row.name) rowErrors.push(`Line ${lineNum}: Missing name`);
    
    if (rowErrors.length === 0) {
      if (row.type && !validTypes.includes(row.type)) {
        errors.push(`Line ${lineNum}: Invalid type "${row.type}"`);
      }
      if (row.status && !validStatuses.includes(row.status)) {
        errors.push(`Line ${lineNum}: Invalid status "${row.status}"`);
      }
      
      // Only add if no errors from validation
      if (!errors.some(e => e.startsWith(`Line ${lineNum}`))) {
        validRows.push(row);
        
        if (allProposalIds.has(row.id)) {
          existingIds.add(row.id);
        }
      }
    } else {
      errors.push(...rowErrors);
    }
  });

  const newIds = validRows
    .filter(r => !existingIds.has(r.id))
    .map(r => r.id);

  return { errors, validRows, existingIds: Array.from(existingIds), newIds };
}

/**
 * Execute CSV import with mode
 * @param {object[]} validRows - Validated proposals
 * @param {object[]} existingProjects - Current projects
 * @param {'skip' | 'overwrite' | 'new_only'} mode - Import mode
 * @returns {{ projects: object[], imported: number, skipped: number, updated: number }}
 */
export function executeCSVImport(validRows, existingProjects, mode = 'skip') {
  let imported = 0, skipped = 0, updated = 0;

  const projectsMap = new Map(
    existingProjects.map(p => [p.id, { ...p, proposals: [...(p.proposals || [])] }])
  );

  validRows.forEach(proposal => {
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

/**
 * Generate new unique proposal ID
 * @returns {string}
 */
function generateNewId() {
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `P-${dateStr}-${seq}`;
}

/**
 * Import CSV file with full workflow
 * @param {File} file - CSV file
 * @param {object[]} existingProjects - Current projects
 * @param {'skip' | 'overwrite' | 'new_only'} mode - Import mode
 * @returns {Promise<{ success: boolean, projects: object[], imported: number, skipped: number, updated: number, errors: string[] }>}
 */
export async function importCSVFile(file, existingProjects, mode = 'skip') {
  try {
    const { headers, rows } = await readCSVFile(file);
    
    if (headers.length === 0 || rows.length === 0) {
      return {
        success: false,
        projects: existingProjects,
        imported: 0,
        skipped: 0,
        updated: 0,
        errors: ['CSV file is empty or has no data rows']
      };
    }
    
    const mapping = detectCSVColumnMapping(headers);
    const transformed = transformCSVRows(rows, mapping);
    const validation = validateCSVImport(transformed, existingProjects);
    
    if (validation.errors.length > 0 && validation.validRows.length === 0) {
      return {
        success: false,
        projects: existingProjects,
        imported: 0,
        skipped: 0,
        updated: 0,
        errors: validation.errors
      };
    }
    
    const result = executeCSVImport(validation.validRows, existingProjects, mode);
    
    return {
      success: true,
      projects: result.projects,
      imported: result.imported,
      skipped: result.skipped,
      updated: result.updated,
      errors: validation.errors
    };
    
  } catch (err) {
    return {
      success: false,
      projects: existingProjects,
      imported: 0,
      skipped: 0,
      updated: 0,
      errors: [err.message]
    };
  }
}

export default {
  parseCSV,
  readCSVFile,
  detectCSVColumnMapping,
  transformCSVRows,
  validateCSVImport,
  executeCSVImport,
  importCSVFile
};
