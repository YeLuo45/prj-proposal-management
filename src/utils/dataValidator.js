/**
 * 校验单个提案
 * @param {object} proposal - 提案对象
 * @param {object[]} projects - 所有项目（用于 projectId 引用校验）
 * @param {object[]} milestones - 所有里程碑（用于 milestoneId 引用校验）
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateProposal(proposal, projects, milestones) {
  const errors = [];

  // id 格式校验
  if (!proposal.id || !/^P-\d{8}-\d{3,}$/.test(proposal.id)) {
    errors.push(`ID 格式错误：${proposal.id}，期望 P-YYYYMMDD-XXX（至少3位数字）`);
  }

  // name 必填
  if (!proposal.name || typeof proposal.name !== 'string' || proposal.name.trim() === '') {
    errors.push('name 必填');
  } else if (proposal.name.length > 200) {
    errors.push('name 不能超过 200 字符');
  }

  // status 枚举
  if (!['active', 'in_dev', 'archived'].includes(proposal.status)) {
    errors.push(`status 枚举值错误：${proposal.status}`);
  }

  // type 枚举
  if (!['web', 'app', 'package'].includes(proposal.type)) {
    errors.push(`type 枚举值错误：${proposal.type}`);
  }

  // tags 数组校验
  if (proposal.tags) {
    if (!Array.isArray(proposal.tags)) {
      errors.push('tags 必须是数组');
    } else if (proposal.tags.some(t => typeof t !== 'string' || t.length > 30)) {
      errors.push('tags 每项最大 30 字符');
    }
  }

  // 日期格式（支持 YYYY-MM-DD 和 ISO 格式）
  if (!/^\d{4}-\d{2}-\d{2}$/.test(proposal.createdAt) && !/^\d{4}-\d{2}-\d{2}T/.test(proposal.createdAt)) {
    errors.push(`createdAt 格式错误：${proposal.createdAt}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(proposal.updatedAt) && !/^\d{4}-\d{2}-\d{2}T/.test(proposal.updatedAt)) {
    errors.push(`updatedAt 格式错误：${proposal.updatedAt}`);
  }

  // URL 格式
  if (proposal.url && proposal.url !== '' && !/^https?:\/\/.+/.test(proposal.url)) {
    errors.push(`url 格式错误：${proposal.url}`);
  }
  if (proposal.gitRepo && proposal.gitRepo !== '' && !/^https?:\/\/.+/.test(proposal.gitRepo)) {
    errors.push(`gitRepo 格式错误：${proposal.gitRepo}`);
  }

  // milestoneId 引用校验
  if (proposal.milestoneId) {
    const exists = milestones.some(m => m.id === proposal.milestoneId);
    if (!exists) {
      errors.push(`milestoneId 不存在：${proposal.milestoneId}`);
    }
  }

  // projectId 引用校验
  if (proposal.projectId) {
    const exists = projects.some(p => p.id === proposal.projectId);
    if (!exists) {
      errors.push(`projectId 不存在：${proposal.projectId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验所有项目中的提案
 * @param {object[]} projects - 所有项目
 * @param {object[]} milestones - 所有里程碑
 * @returns {{ valid: boolean, errors: ProposalError[], warnings: string[] }}
 */
export function validateProjects(projects, milestones) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();

  projects.forEach(project => {
    project.proposals?.forEach(proposal => {
      // 重复 ID 检测
      if (seenIds.has(proposal.id)) {
        errors.push({ proposalId: proposal.id, field: 'id', message: `ID 重复：${proposal.id}，出现在项目 ${seenIds.get(proposal.id)} 和 ${project.id}` });
      } else {
        seenIds.set(proposal.id, project.id);
      }

      // 单条校验
      const result = validateProposal(proposal, projects, milestones);
      if (!result.valid) {
        result.errors.forEach(err => errors.push({ proposalId: proposal.id, message: err }));
      }

      // 过期 active 警告
      if (proposal.status === 'active') {
        const updated = new Date(proposal.updatedAt);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (updated < oneYearAgo) {
          warnings.push({ proposalId: proposal.id, message: `提案超过一年未更新，建议归档` });
        }
      }
    });
  });

  return { valid: errors.length === 0, errors, warnings };
}
