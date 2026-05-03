import { downloadFile } from './csvExporter';

/**
 * 生成 JSON 备份
 * @param {object[]} projects
 * @param {object[]} milestones
 * @returns {object}
 */
export function generateBackup(projects, milestones) {
  const allProposals = projects.flatMap(p => p.proposals || []);
  return {
    version: 3,
    projects,
    backupAt: new Date().toISOString(),
    recordCount: {
      projects: projects.length,
      proposals: allProposals.length,
      milestones: milestones.length
    }
  };
}

/**
 * 从备份文件恢复
 * @param {object} backupData - 解析后的 JSON 备份
 * @returns {{ projects: object[], error?: string }}
 */
export function restoreFromBackup(backupData) {
  if (!backupData.version) {
    return { projects: [], error: '无效的备份文件：缺少 version 字段' };
  }
  if (!Array.isArray(backupData.projects)) {
    return { projects: [], error: '无效的备份文件：projects 必须是数组' };
  }
  return { projects: backupData.projects };
}

/**
 * 下载 JSON 备份文件
 * @param {object[]} projects
 * @param {object[]} milestones
 */
export function downloadJSONBackup(projects, milestones) {
  const backup = generateBackup(projects, milestones);
  const filename = `proposals-backup-${new Date().toISOString().split('T')[0]}.json`;
  const content = JSON.stringify(backup, null, 2);
  downloadFile(content, filename, 'application/json');
}
