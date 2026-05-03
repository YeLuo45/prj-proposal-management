export function checkIntegrity(projects, milestones) {
  const issues = {
    orphanProposals: [],    // projectId 不存在
    invalidMilestones: [],   // milestoneId 不存在
    duplicateIds: [],        // 重复 ID
    expiredActive: [],       // 过期 active
  };

  const projectIds = new Set(projects.map(p => p.id));
  const milestoneIds = new Set(milestones.map(m => m.id));
  const seenIds = new Map();

  projects.forEach(project => {
    project.proposals?.forEach(proposal => {
      if (!projectIds.has(proposal.projectId)) {
        issues.orphanProposals.push(proposal.id);
      }
      if (proposal.milestoneId && !milestoneIds.has(proposal.milestoneId)) {
        issues.invalidMilestones.push(proposal.id);
      }
      if (seenIds.has(proposal.id)) {
        issues.duplicateIds.push(proposal.id);
      } else {
        seenIds.set(proposal.id, project.id);
      }
      if (proposal.status === 'active') {
        const updated = new Date(proposal.updatedAt);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (updated < oneYearAgo) {
          issues.expiredActive.push(proposal.id);
        }
      }
    });
  });

  return issues;
}
