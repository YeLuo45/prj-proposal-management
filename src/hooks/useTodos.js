import { useState, useCallback } from 'react';

const GITHUB_API = 'https://api.github.com';
const OWNER = 'YeLuo45';
const REPO = 'prj-proposals-manager';
const BRANCH = 'master';

export function useTodos() {
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

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

      const response = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/todos.json?ref=${BRANCH}`,
        {
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // File doesn't exist yet, return default structure
          return { todos: [] };
        }
        throw new Error('获取待办事项数据失败');
      }

      const data = await response.json();
      // 修复中文乱码
      const content = decodeURIComponent(escape(atob(data.content)));
      return JSON.parse(content);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const saveTodos = useCallback(async (todosData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('github_token');
      if (!token) {
        throw new Error('请先设置 GitHub Token');
      }

      let sha = null;
      
      // Try to get current file SHA
      const getResponse = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/todos.json?ref=${BRANCH}`,
        {
          headers: getHeaders(),
        }
      );

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }

      // Update file
      // 修复中文乱码
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(todosData, null, 2))));
      const putResponse = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/todos.json`,
        {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            message: 'Update todos data',
            content,
            sha,
            branch: BRANCH,
          }),
        }
      );

      if (!putResponse.ok) {
        throw new Error('保存待办事项数据失败');
      }

      return await putResponse.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  return {
    loading,
    error,
    fetchTodos,
    saveTodos,
  };
}
