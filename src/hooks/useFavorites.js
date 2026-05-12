import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from './useToast';

const FAVORITES_URL = 'https://raw.githubusercontent.com/YeLuo45/prj-proposals-manager/master/data/favorites.json';
const GITHUB_API = 'https://api.github.com';
const OWNER = 'YeLuo45';
const REPO = 'prj-proposals-manager';
const BRANCH = 'master';
const CACHE_KEY = 'favorites_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFavorites() {
  const [favorites, setFavorites] = useState({});
  const [loading, setLoading] = useState(false);

  // Derived list of {id, timestamp} for convenience
  const favoritesList = useMemo(() => {
    return Object.entries(favorites)
      .map(([id, timestamp]) => ({ id, timestamp }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [favorites]);

  // Cache helpers
  const getCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_TTL) return null;
      return data;
    } catch {
      return null;
    }
  }, []);

  const setCache = useCallback((data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch {
      // localStorage full or unavailable
    }
  }, []);

  // Fetch favorites from GitHub (only when cache miss or force refresh)
  const fetchFavorites = useCallback(async (forceRefresh = false) => {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cached = getCache();
      if (cached) {
        setFavorites(cached);
        return; // Use cache, skip network request
      }
    }

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
      const favData = data.favorites || {};
      setFavorites(favData);
      setCache(favData);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
      // On error, try to use stale cache
      const cached = getCache();
      if (cached) {
        setFavorites(cached);
      } else {
        setFavorites({});
      }
    }
  }, [getCache, setCache]);

  // Load favorites on mount (uses cache if available)
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

    // Optimistic update
    const isFav = !!favorites[projectId];
    const newFavorites = isFav
      ? Object.fromEntries(Object.entries(favorites).filter(([id]) => id !== projectId))
      : { ...favorites, [projectId]: new Date().toISOString() };

    setFavorites(newFavorites);
    setCache(newFavorites);

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
            message: `Update favorites: ${projectId} ${isFav ? 'removed' : 'added'}`,
            content,
            sha,
            branch: BRANCH,
          }),
        }
      );

      if (!putResponse.ok) {
        throw new Error('保存收藏失败');
      }

      toast.success(isFav ? '已从收藏移除' : '已添加到收藏');
    } catch (err) {
      console.error('Failed to update favorites:', err);
      // Revert local state on failure
      setFavorites(favorites);
      toast.error('同步收藏失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [favorites, getCache, setCache]);

  return {
    favorites,
    favoritesList,
    loading,
    toggleFavorite,
    refreshFavorites: fetchFavorites,
  };
}
