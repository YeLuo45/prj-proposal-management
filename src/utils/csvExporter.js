/**
 * 将 projects 数据导出为 CSV 字符串
 * @param {object[]} projects - projects 数组
 * @returns {string} CSV 格式字符串
 */
export function exportProjectsToCSV(projects) {
  const headers = [
    'id', 'name', 'description', 'type', 'status',
    'projectId', 'projectName',
    'tags', 'milestoneId', 'milestoneName',
    'url', 'gitRepo',
    'createdAt', 'updatedAt'
  ];

  const rows = [];
  projects.forEach(project => {
    project.proposals?.forEach(proposal => {
      const tags = Array.isArray(proposal.tags) ? proposal.tags.join(',') : (proposal.tags || '');
      const milestone = project.milestones?.find(m => m.id === proposal.milestoneId);
      rows.push([
        proposal.id,
        proposal.name,
        `"${(proposal.description || '').replace(/"/g, '""')}"`,  // CSV escaping
        proposal.type,
        proposal.status,
        project.id,
        `"${project.name.replace(/"/g, '""')}"`,
        `"${tags.replace(/"/g, '""')}"`,
        proposal.milestoneId || '',
        milestone ? `"${milestone.name.replace(/"/g, '""')}"` : '',
        proposal.url || '',
        proposal.gitRepo || '',
        proposal.createdAt || '',
        proposal.updatedAt || ''
      ].join(','));
    });
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * 触发浏览器下载文件
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
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
