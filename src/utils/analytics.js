/**
 * Analytics utility for project proposals dashboard
 * Provides data analysis functions for BurndownChart, VelocityChart, and WorkloadChart
 */

/**
 * Calculate burndown data from milestones
 * @param {Array} milestones - Array of milestone objects
 * @returns {Object} - { labels, ideal, actual }
 */
export function calculateBurndown(milestones) {
  if (!milestones || milestones.length === 0) {
    return { labels: [], ideal: [], actual: [] };
  }

  const sorted = [...milestones].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );

  const startDate = new Date(sorted[0].startDate);
  const endDate = new Date(sorted[sorted.length - 1].endDate);
  const durationWeeks = Math.ceil(
    (endDate - startDate) / (7 * 24 * 60 * 60 * 1000)
  );

  const totalPoints = sorted.length * 10; // Each milestone = 10 points
  const labels = [];
  const ideal = [];

  for (let i = 0; i <= durationWeeks; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i * 7);
    labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));

    const idealRemaining = totalPoints - (totalPoints * i / durationWeeks);
    ideal.push(Math.max(0, Math.round(idealRemaining)));
  }

  // Calculate actual based on completed milestones
  const completedCount = sorted.filter(ms => ms.status === 'completed').length;
  const progressRatio = completedCount / sorted.length;

  const actual = ideal.map((_, idx) => {
    return Math.round(totalPoints * (1 - progressRatio * idx / durationWeeks));
  });

  return { labels, ideal, actual };
}

/**
 * Calculate velocity data from proposals
 * @param {Array} proposals - Flat array of proposals
 * @param {number} months - Number of months to look back (default 6)
 * @returns {Object} - { labels, completed, planned }
 */
export function calculateVelocity(proposals, months = 6) {
  const now = new Date();
  const labels = [];
  const completed = [];
  const planned = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    labels.push(d.toLocaleDateString('zh-CN', { month: 'short' }));

    const monthCompleted = (proposals || []).filter(p => {
      if (p.status !== 'accepted' && p.status !== 'delivered') return false;
      const updatedAt = p.updatedAt || '';
      return updatedAt.startsWith(monthKey);
    }).length;
    completed.push(monthCompleted);

    const monthPlanned = (proposals || []).filter(p => {
      const createdAt = p.createdAt || '';
      return createdAt.startsWith(monthKey);
    }).length;
    planned.push(monthPlanned);
  }

  return { labels, completed, planned };
}

/**
 * Calculate workload distribution from projects
 * @param {Array} projects - Array of project objects with proposals
 * @returns {Object} - { labels, active, inDev, completed }
 */
export function calculateWorkload(projects) {
  if (!projects || projects.length === 0) {
    return { labels: [], active: [], inDev: [], completed: [] };
  }

  const labels = projects.map(p => p.name);
  const active = projects.map(p =>
    (p.proposals || []).filter(proposal => proposal.status === 'active').length
  );
  const inDev = projects.map(p =>
    (p.proposals || []).filter(proposal => proposal.status === 'in_dev').length
  );
  const completed = projects.map(p =>
    (p.proposals || []).filter(proposal =>
      proposal.status === 'accepted' ||
      proposal.status === 'delivered' ||
      proposal.status === 'archived'
    ).length
  );

  return { labels, active, inDev, completed };
}

/**
 * Calculate summary statistics for dashboard
 * @param {Array} projects - Array of project objects
 * @returns {Object} - { totalCount, thisMonthCount, inProgressCount, completedCount }
 */
export function calculateSummaryStats(projects) {
  const flatProposals = (projects || []).flatMap(p => p.proposals || []);
  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  return {
    totalCount: flatProposals.length,
    thisMonthCount: flatProposals.filter(p => (p.createdAt || '').startsWith(thisMonth)).length,
    inProgressCount: flatProposals.filter(p => p.status === 'in_dev').length,
    completedCount: flatProposals.filter(p =>
      p.status === 'accepted' || p.status === 'delivered'
    ).length,
  };
}

/**
 * Get project health indicator based on milestone completion
 * @param {Array} projectMilestones - Array of milestones for a project
 * @returns {Object} - { score, status, message }
 */
export function getProjectHealth(projectMilestones) {
  if (!projectMilestones || projectMilestones.length === 0) {
    return { score: 0, status: 'unknown', message: '无里程碑数据' };
  }

  const completed = projectMilestones.filter(ms => ms.status === 'completed').length;
  const total = projectMilestones.length;
  const percentage = Math.round((completed / total) * 100);

  let status, message;
  if (percentage >= 80) {
    status = 'healthy';
    message = '进展良好';
  } else if (percentage >= 50) {
    status = 'warning';
    message = '需要关注';
  } else if (percentage > 0) {
    status = 'at_risk';
    message = '存在风险';
  } else {
    status = 'no_progress';
    message = '暂无进展';
  }

  return { score: percentage, status, message };
}
