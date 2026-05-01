import { useState, useEffect, useCallback } from 'react';

const GITHUB_API = 'https://api.github.com';
const OWNER = 'YeLuo45';
const REPO = 'proposals-manager';
const BRANCH = 'main';

// 数据迁移到 v3
function migrateToV3(data) {
  // 如果已是 v3，直接返回
  if (data.version === 3) return data;

  // 兼容旧格式：只有 proposals 没有 projects
  // 将所有提案作为"未分类"项目
  const defaultProject = {
    id: 'PRJ-DEFAULT-001',
    name: '默认项目',
    description: '包含所有未分类的提案',
    createdAt: '2025-04-17',
    updatedAt: new Date().toISOString().split('T')[0],
    milestones: []
  };

  const projects = data.projects || [defaultProject];

  return {
    version: 3,
    projects: projects.map(p => ({
      ...p,
      milestones: p.milestones || []
    })),
    proposals: data.proposals || []
  };
}

export function useGitHub() {
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

      const response = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/proposals.json?ref=${BRANCH}`,
        {
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('获取数据失败');
      }

      const data = await response.json();
      const content = atob(data.content);
      const parsed = JSON.parse(content);

      // 自动迁移到 v3
      const v3Data = migrateToV3(parsed);

      return v3Data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const saveData = useCallback(async (v3Data) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

      // 确保是 v3 格式
      const dataToSave = { ...v3Data, version: 3 };

      // Get current file SHA
      const getResponse = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/proposals.json?ref=${BRANCH}`,
        {
          headers: getHeaders(),
        }
      );

      if (!getResponse.ok) {
        throw new Error('获取文件信息失败');
      }

      const fileData = await getResponse.json();
      const sha = fileData.sha;

      // Update file
      const content = btoa(JSON.stringify(dataToSave, null, 2));
      const putResponse = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/proposals.json`,
        {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            message: 'Update proposals data',
            content,
            sha,
            branch: BRANCH,
          }),
        }
      );

      if (!putResponse.ok) {
        throw new Error('保存数据失败');
      }

      return await putResponse.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  // 仅保存 proposals（兼容旧接口）
  const saveProposals = useCallback(async ({ proposals }) => {
    const data = await fetchData();
    return saveData({ ...data, proposals });
  }, [fetchData, saveData]);

  const uploadAsset = useCallback(async (releaseId, file, fileName) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', fileName);

      const response = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/releases/assets/${releaseId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('上传文件失败');
      }

      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchData,
    saveData,
    saveProposals,
    uploadAsset,
  };
}
