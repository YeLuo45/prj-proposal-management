/**
 * 将 projects + proposals 数据导出为结构化 CSV 文件
 * projects.csv — 项目信息（不含提案）
 * proposals.csv — 提案信息（含 projectId 外键）
 */

/**
 * 导出 projects.csv
 */
export function exportProjectsToCSV(projects) {
  const headers = [
    'id', 'name', 'description', 'prj_url', 'gitRepo', 'createdAt', 'updatedAt'
  ];

  const rows = projects.map(project => [
    project.id,
    csvEscape(project.name),
    csvEscape(project.description || ''),
    csvEscape(project.prj_url || ''),
    csvEscape(project.gitRepo || ''),
    project.createdAt || '',
    project.updatedAt || ''
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * 导出 proposals.csv
 */
export function exportProposalsToCSV(projects) {
  const headers = [
    'id', 'name', 'description', 'type', 'status',
    'url', 'packageUrl', 'gitRepo', 'tags',
    'projectId', 'projectName',
    'milestoneId', 'milestoneName',
    'prdConfirmation', 'techExpectations', 'acceptance',
    'createdAt', 'updatedAt'
  ];

  const rows = [];
  projects.forEach(project => {
    const milestoneMap = {};
    (project.milestones || []).forEach(m => { milestoneMap[m.id] = m.name; });

    (project.proposals || []).forEach(proposal => {
      const tags = Array.isArray(proposal.tags) ? proposal.tags.join(';') : (proposal.tags || '');
      rows.push([
        proposal.id,
        csvEscape(proposal.name),
        csvEscape(proposal.description || ''),
        proposal.type || '',
        proposal.status || '',
        csvEscape(proposal.url || ''),
        csvEscape(proposal.packageUrl || ''),
        csvEscape(proposal.gitRepo || ''),
        csvEscape(tags),
        project.id,
        csvEscape(project.name),
        proposal.milestoneId || '',
        csvEscape(milestoneMap[proposal.milestoneId] || ''),
        proposal.prdConfirmation || '',
        csvEscape(proposal.techExpectations || ''),
        proposal.acceptance || '',
        proposal.createdAt || '',
        proposal.updatedAt || ''
      ].join(','));
    });
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * 导出 milestones.csv
 */
export function exportMilestonesToCSV(projects) {
  const headers = ['id', 'name', 'description', 'projectId', 'projectName', 'createdAt'];
  const rows = [];
  projects.forEach(project => {
    (project.milestones || []).forEach(m => {
      rows.push([
        m.id,
        csvEscape(m.name),
        csvEscape(m.description || ''),
        project.id,
        csvEscape(project.name),
        m.createdAt || ''
      ].join(','));
    });
  });
  if (rows.length === 0) return '';
  return [headers.join(','), ...rows].join('\n');
}

/**
 * 从扁平提案数组（含 projectId/projectName 字段）重建项目结构，
 * 便于导出和 CSV 序列化
 */
function rebuildProjectsFromFlatProposals(flatProposals, allProjects) {
  const projMap = {};
  allProjects.forEach(p => { projMap[p.id] = p; });

  const propMap = {}; // projectId -> proposal[]
  flatProposals.forEach(prop => {
    const proj = projMap[prop.projectId];
    if (!proj) return;
    propMap[proj.id] = propMap[proj.id] || [];
    // reconstruct flat proposal back to full proposal object (with projectId/name)
    propMap[proj.id].push({
      ...prop,
      projectId: proj.id,
      projectName: proj.name,
    });
  });

  return Object.entries(propMap).map(([projId, proposals]) => {
    const proj = projMap[projId];
    return { ...proj, proposals };
  });
}

/**
 * 触发浏览器下载文件
 */
export function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 同时下载 projects.csv + proposals.csv + milestones.csv
 */
export function downloadAllCSVs(projects) {
  downloadFile(exportProjectsToCSV(projects), `projects-${Date.now()}.csv`, 'text/csv');
  setTimeout(() => {
    const csv = exportProposalsToCSV(projects);
    if (csv) downloadFile(csv, `proposals-${Date.now()}.csv`, 'text/csv');
  }, 100);
  setTimeout(() => {
    const csv = exportMilestonesToCSV(projects);
    if (csv) downloadFile(csv, `milestones-${Date.now()}.csv`, 'text/csv');
  }, 200);
}

/**
 * 下载筛选后的提案 CSV
 */
export function downloadFilteredCSVs(flatProposals, allProjects) {
  const rebuilt = rebuildProjectsFromFlatProposals(flatProposals, allProjects);
  downloadAllCSVs(rebuilt);
}

function csvEscape(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
