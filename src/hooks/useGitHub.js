import { useState, useCallback } from 'react';

const GITHUB_API = 'https://api.github.com';
const OWNER = 'YeLuo45';
const REPO = 'prj-proposals-manager';
const BRANCH = 'master';

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

  const fetchProposals = useCallback(async () => {
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
        throw new Error('获取提案数据失败');
      }

      const data = await response.json();
      // 修复中文乱码：atob() 返回的是 Latin-1 字符串，需用 escape/ decodeURIComponent 转为 UTF-8
      const content = decodeURIComponent(escape(atob(data.content)));
      return JSON.parse(content);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const saveProposals = useCallback(async (proposalsData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

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
      // 修复中文乱码：btoa() 无法处理非 Latin-1 字符，需用 encodeURIComponent/unescape 转换
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(proposalsData, null, 2))));
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
        throw new Error('保存提案数据失败');
      }

      return await putResponse.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

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
    fetchProposals,
    saveProposals,
    uploadAsset,
  };
}
