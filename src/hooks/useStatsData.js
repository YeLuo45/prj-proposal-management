import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGitHub } from './useGitHub';

const GITHUB_API = 'https://api.github.com';
const OWNER = 'YeLuo45';
const REPO = 'prj-proposals-manager';
const BRANCH = 'master';

export function useStatsData() {
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
      };

      // Fetch proposals
      const proposalsRes = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/proposals.json?ref=${BRANCH}`,
        { headers }
      );
      if (!proposalsRes.ok) throw new Error('获取提案数据失败');
      const proposalsData = await proposalsRes.json();
      const proposalsContent = decodeURIComponent(escape(atob(proposalsData.content)));
      const proposalsJson = JSON.parse(proposalsContent);

      // Fetch milestones
      const milestonesRes = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/milestones.json?ref=${BRANCH}`,
        { headers }
      );
      let milestonesJson = { milestones: [] };
      if (milestonesRes.ok) {
        const milestonesData = await milestonesRes.json();
        const milestonesContent = decodeURIComponent(escape(atob(milestonesData.content)));
        milestonesJson = JSON.parse(milestonesContent);
      }

      // Normalize data
      let flatProposals = [];
      let projectsData = [];

      if (proposalsJson.projects && Array.isArray(proposalsJson.projects)) {
        projectsData = proposalsJson.projects;
        flatProposals = proposalsJson.projects.flatMap(project =>
          (project.proposals || []).map(p => ({
            ...p,
            projectName: project.name,
            projectId: project.id,
          }))
        );
      } else if (proposalsJson.proposals && Array.isArray(proposalsJson.proposals)) {
        flatProposals = proposalsJson.proposals;
      }

      setProjects(projectsData);
      setMilestones(milestonesJson.milestones || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const flatProposals = projects.length > 0
      ? projects.flatMap(p => p.proposals || [])
      : [];

    const totalCount = flatProposals.length;

    // This month new
    const now = new Date();
    const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const thisMonthCount = flatProposals.filter(p => {
      const created = p.createdAt || '';
      return created.startsWith(thisMonth);
    }).length;

    // In progress (in_dev)
    const inProgressCount = flatProposals.filter(p => p.status === 'in_dev').length;

    // Completed (accepted or delivered)
    const completedCount = flatProposals.filter(p =>
      p.status === 'accepted' || p.status === 'delivered'
    ).length;

    return {
      totalCount,
      thisMonthCount,
      inProgressCount,
      completedCount,
    };
  }, [projects]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const flatProposals = projects.length > 0
      ? projects.flatMap(p => p.proposals || [])
      : [];

    const now = new Date();
    const months = [];
    const createdData = [];
    const completedData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const monthLabel = d.getMonth() + 1 + '月';
      months.push(monthLabel);

      // Count created in this month
      const created = flatProposals.filter(p => {
        const createdAt = p.createdAt || '';
        return createdAt.startsWith(monthKey);
      }).length;
      createdData.push(created);

      // Count completed in this month (accepted or delivered)
      const completed = flatProposals.filter(p => {
        const updatedAt = p.updatedAt || '';
        if (!updatedAt.startsWith(monthKey)) return false;
        return p.status === 'accepted' || p.status === 'delivered';
      }).length;
      completedData.push(completed);
    }

    return { months, createdData, completedData };
  }, [projects]);

  // Project progress (status distribution)
  const projectProgress = useMemo(() => {
    if (projects.length === 0) {
      return { labels: [], active: [], inDev: [], archived: [] };
    }

    const labels = projects.map(p => p.name);
    const active = projects.map(p =>
      (p.proposals || []).filter(proposal => proposal.status === 'active').length
    );
    const inDev = projects.map(p =>
      (p.proposals || []).filter(proposal => proposal.status === 'in_dev').length
    );
    const archived = projects.map(p =>
      (p.proposals || []).filter(proposal =>
        proposal.status === 'archived' || proposal.status === 'accepted' || proposal.status === 'delivered'
      ).length
    );

    return { labels, active, inDev, archived };
  }, [projects]);

  // Milestone progress
  const milestoneProgress = useMemo(() => {
    if (projects.length === 0 || milestones.length === 0) {
      return [];
    }

    return projects.map(project => {
      const projectMilestones = milestones.filter(ms => ms.projectId === project.id);
      const total = projectMilestones.length;
      const completed = projectMilestones.filter(ms => ms.status === 'completed').length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        projectId: project.id,
        projectName: project.name,
        total,
        completed,
        percentage,
      };
    }).filter(p => p.total > 0);
  }, [projects, milestones]);

  // Recent activity (last 10 updated proposals)
  const recentActivity = useMemo(() => {
    const flatProposals = projects.length > 0
      ? projects.flatMap(p => p.proposals || [])
      : [];

    return flatProposals
      .filter(p => p.updatedAt)
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt);
        const dateB = new Date(b.updatedAt);
        return dateB - dateA;
      })
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        projectName: p.projectName || '未分类',
        updatedAt: p.updatedAt,
        status: p.status,
      }));
  }, [projects]);

  return {
    loading,
    error,
    stats,
    monthlyTrend,
    projectProgress,
    milestoneProgress,
    recentActivity,
    refetch: fetchData,
  };
}
