import { useState, useEffect, useCallback, useMemo } from 'react';

const SEARCH_HISTORY_KEY = 'global_search_history';
const MAX_HISTORY_ITEMS = 5;

export function useGlobalSearch(proposals = [], milestones = []) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState('proposals');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load search history:', e);
    }
  }, []);

  // Debounce the query (150ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset selected index when query or tab changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery, activeTab]);

  // Save to search history
  const saveToHistory = useCallback((searchQuery) => {
    if (!searchQuery.trim()) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== searchQuery);
      const updated = [searchQuery, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save search history:', e);
      }
      return updated;
    });
  }, []);

  // Open/close modal
  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);
  const toggleSearch = useCallback(() => {
    if (isOpen) closeSearch();
    else openSearch();
  }, [isOpen, openSearch, closeSearch]);

  // Search filter function
  const matchesSearch = useCallback((item, searchTerm) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fields = ['id', 'name', 'title', 'description', 'status'];
    // For proposals, also check tags
    if (item.tags && Array.isArray(item.tags)) {
      return item.tags.some(tag => tag.toLowerCase().includes(term)) ||
        fields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(term);
        });
    }
    return fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(term);
    });
  }, []);

  // Filtered results
  const filteredProposals = useMemo(() => {
    if (!debouncedQuery) return [];
    return proposals.filter(p => matchesSearch(p, debouncedQuery));
  }, [proposals, debouncedQuery, matchesSearch]);

  const filteredMilestones = useMemo(() => {
    if (!debouncedQuery) return [];
    return milestones.filter(m => matchesSearch(m, debouncedQuery));
  }, [milestones, debouncedQuery, matchesSearch]);

  // Current results based on active tab
  const currentResults = activeTab === 'proposals' ? filteredProposals : filteredMilestones;

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, currentResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (currentResults[selectedIndex]) {
          saveToHistory(query);
          return currentResults[selectedIndex];
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeSearch();
        break;
      case 'Tab':
        e.preventDefault();
        setActiveTab(prev => prev === 'proposals' ? 'milestones' : 'proposals');
        setSelectedIndex(0);
        break;
    }
    return null;
  }, [isOpen, currentResults, selectedIndex, query, saveToHistory, closeSearch]);

  // Register global keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch]);

  // Clear history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  return {
    isOpen,
    query,
    setQuery,
    debouncedQuery,
    activeTab,
    setActiveTab,
    selectedIndex,
    setSelectedIndex,
    searchHistory,
    clearHistory,
    filteredProposals,
    filteredMilestones,
    currentResults,
    openSearch,
    closeSearch,
    toggleSearch,
    handleKeyDown,
    saveToHistory,
  };
}

export default useGlobalSearch;
