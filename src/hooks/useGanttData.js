import { useState, useCallback, useMemo } from 'react';

const GITHUB_API = 'https://api.github.com';
const OWNER = 'YeLuo45';
const REPO = 'prj-proposals-manager';
const BRANCH = 'master';

export function useGanttData() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('github_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github+json',
    };
  }, []);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

      const response = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/milestones.json?ref=${BRANCH}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error('获取里程碑数据失败');
      }

      const data = await response.json();
      const content = decodeURIComponent(escape(atob(data.content)));
      const parsed = JSON.parse(content);
      return parsed.milestones || [];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const loadMilestones = useCallback(async () => {
    try {
      const data = await fetchMilestones();
      setMilestones(data);
    } catch (err) {
      console.error('Failed to load milestones:', err);
    }
  }, [fetchMilestones]);

  const saveMilestones = useCallback(async (milestonesData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

      const getResponse = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/milestones.json?ref=${BRANCH}`,
        { headers: getHeaders() }
      );

      if (!getResponse.ok) {
        throw new Error('获取文件信息失败');
      }

      const fileData = await getResponse.json();
      const sha = fileData.sha;

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(milestonesData, null, 2))));
      const putResponse = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/milestones.json`,
        {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            message: 'Update milestones data',
            content,
            sha,
            branch: BRANCH,
          }),
        }
      );

      if (!putResponse.ok) {
        throw new Error('保存里程碑数据失败');
      }

      return await putResponse.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const updateMilestone = useCallback(async (milestoneId, updates) => {
    const updated = milestones.map(m =>
      m.id === milestoneId
        ? { ...m, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
        : m
    );
    setMilestones(updated);
    await saveMilestones({ milestones: updated });
  }, [milestones, saveMilestones]);

  const getMilestoneStatus = useCallback((milestone) => {
    const today = new Date().toISOString().split('T')[0];
    if (milestone.status === 'completed') return 'completed';
    if (milestone.endDate < today) return 'overdue';
    if (milestone.startDate > today) return 'pending';
    return 'in_progress';
  }, []);

  const groupByProject = useCallback((milestonesList) => {
    const groups = {};
    milestonesList.forEach(ms => {
      if (!groups[ms.projectId]) {
        groups[ms.projectId] = {
          projectId: ms.projectId,
          projectName: ms.projectId,
          milestones: []
        };
      }
      groups[ms.projectId].milestones.push(ms);
    });
    return Object.values(groups);
  }, []);

  const allProjectIds = useMemo(() => {
    return [...new Set(milestones.map(m => m.projectId))];
  }, [milestones]);

  const allStatuses = ['pending', 'in_progress', 'completed', 'overdue'];

  return {
    milestones,
    loading,
    error,
    loadMilestones,
    saveMilestones,
    updateMilestone,
    getMilestoneStatus,
    groupByProject,
    allProjectIds,
    allStatuses,
  };
}
