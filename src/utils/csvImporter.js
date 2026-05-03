/**
 * 解析 CSV 文本为对象数组（无外部依赖）
 * @param {string} text - CSV 原始文本
 * @returns {{ headers: string[], rows: object[] }}
 */
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };

  // 简单 CSV 解析（处理带引号的字段）
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
 * 校验 CSV 行数据
 * @param {object[]} rows - 解析后的行对象
 * @param {object[]} existingProjects - 当前 projects（用于检测重复 ID）
 * @returns {{ errors: string[], validRows: object[], existingIds: Set<string>, newIds: string[] }}
 */
export function validateCSVImport(rows, existingProjects) {
  const errors = [];
  const validRows = [];
  const existingIds = new Set();

  // 收集所有已有提案 ID
  const allProposalIds = new Set();
  existingProjects.forEach(p => {
    p.proposals?.forEach(proposal => allProposalIds.add(proposal.id));
  });

  rows.forEach((row, idx) => {
    const lineNum = idx + 2;  // +2 because of header row and 0-index

    // 必填字段
    if (!row.id) errors.push(`第 ${lineNum} 行：缺少 id`);
    if (!row.name) errors.push(`第 ${lineNum} 行：缺少 name`);
    if (!row.status) errors.push(`第 ${lineNum} 行：缺少 status`);
    if (!row.type) errors.push(`第 ${lineNum} 行：缺少 type`);

    if (errors.length === 0 || errors[errors.length - 1].startsWith(`第 ${lineNum}`)) {
      // 枚举校验
      if (row.status && !['active', 'in_dev', 'archived'].includes(row.status)) {
        errors.push(`第 ${lineNum} 行：status 值无效「${row.status}」`);
      }
      if (row.type && !['web', 'app', 'package'].includes(row.type)) {
        errors.push(`第 ${lineNum} 行：type 值无效「${row.type}」`);
      }
    }

    if (errors.filter(e => e.startsWith(`第 ${lineNum}`)).length === 0) {
      // 解析 tags（逗号分隔）
      const tags = row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const proposal = {
        id: row.id,
        name: row.name,
        description: row.description || '',
        type: row.type,
        status: row.status,
        projectId: row.projectId || '',
        tags,
        milestoneId: row.milestoneId || null,
        url: row.url || '',
        gitRepo: row.gitRepo || '',
        createdAt: row.createdAt || new Date().toISOString().split('T')[0],
        updatedAt: row.updatedAt || new Date().toISOString().split('T')[0]
      };
      validRows.push(proposal);

      if (allProposalIds.has(row.id)) {
        existingIds.add(row.id);
      }
    }
  });

  const newIds = validRows.filter(r => !existingIds.has(r.id)).map(r => r.id);

  return { errors, validRows, existingIds: Array.from(existingIds), newIds };
}

/**
 * 执行 CSV 导入
 * @param {object[]} validRows - 校验通过的提案
 * @param {object[]} existingProjects - 当前 projects
 * @param {'skip' | 'overwrite' | 'new_only'} mode - 导入模式
 * @returns {{ projects: object[], imported: number, skipped: number, updated: number }}
 */
export function executeCSVImport(validRows, existingProjects, mode = 'skip') {
  let imported = 0, skipped = 0, updated = 0;

  const projectsMap = new Map(existingProjects.map(p => [p.id, { ...p, proposals: [...(p.proposals || [])] }]));

  validRows.forEach(proposal => {
    const project = projectsMap.get(proposal.projectId);
    if (!project) {
      // project 不存在则跳过（不自动创建项目）
      skipped++;
      return;
    }

    const existingIdx = project.proposals.findIndex(p => p.id === proposal.id);

    if (existingIdx !== -1) {
      if (mode === 'skip') {
        skipped++;
      } else if (mode === 'overwrite') {
        project.proposals[existingIdx] = { ...proposal, updatedAt: new Date().toISOString().split('T')[0] };
        updated++;
      } else if (mode === 'new_only') {
        // 生成新 ID
        proposal.id = generateNewId();
        project.proposals.push({ ...proposal, createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] });
        imported++;
      }
    } else {
      project.proposals.push({ ...proposal, createdAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] });
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
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `P-${dateStr}-${seq}`;
}
