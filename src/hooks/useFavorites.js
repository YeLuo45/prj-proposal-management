import { useState, useEffect, useCallback } from 'react';
import { toast } from './useToast';

const FAVORITES_URL = 'https://raw.githubusercontent.com/YeLuo45/prj-proposals-manager/master/data/favorites.json';
const GITHUB_API = 'https://api.github.com';
const OWNER = 'YeLuo45';
const REPO = 'prj-proposals-manager';
const BRANCH = 'master';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch favorites from GitHub raw URL
  const fetchFavorites = useCallback(async () => {
    try {
      const token = import.meta.env.VITE_GH_TOKEN || localStorage.getItem('github_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(FAVORITES_URL, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      // Initialize with empty array on error
      setFavorites([]);
    }
  }, []);

  // Load favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Toggle favorite and sync to GitHub
  const toggleFavorite = useCallback(async (projectId) => {
    setLoading(true);
    const token = import.meta.env.VITE_GH_TOKEN || localStorage.getItem('github_token');
    
    if (!token) {
      toast.error('请先设置 GitHub Token');
      setLoading(false);
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
      };

      // Get current file SHA
      const getResponse = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/favorites.json?ref=${BRANCH}`,
        { headers }
      );

      if (!getResponse.ok) {
        throw new Error('获取文件信息失败');
      }

      const fileData = await getResponse.json();
      const sha = fileData.sha;

      // Update favorites list
      const newFavorites = favorites.includes(projectId)
        ? favorites.filter(id => id !== projectId)
        : [...favorites, projectId];

      // Prepare updated content
      const content = btoa(unescape(encodeURIComponent(JSON.stringify({
        favorites: newFavorites,
        updatedAt: new Date().toISOString(),
      }, null, 2))));

      // Update file on GitHub
      const putResponse = await fetch(
        `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/data/favorites.json`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `Update favorites: ${projectId} ${favorites.includes(projectId) ? 'removed' : 'added'}`,
            content,
            sha,
            branch: BRANCH,
          }),
        }
      );

      if (!putResponse.ok) {
        throw new Error('保存收藏失败');
      }

      // Update local state
      setFavorites(newFavorites);
      toast.success(newFavorites.includes(projectId) ? '已添加到收藏' : '已从收藏移除');
    } catch (err) {
      console.error('Failed to update favorites:', err);
      toast.error('同步收藏失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  return {
    favorites,
    loading,
    toggleFavorite,
    refreshFavorites: fetchFavorites,
  };
}
