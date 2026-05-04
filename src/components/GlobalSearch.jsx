import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function GlobalSearch({
  isOpen,
  query,
  setQuery,
  activeTab,
  setActiveTab,
  selectedIndex,
  setSelectedIndex,
  searchHistory,
  filteredProposals,
  filteredMilestones,
  currentResults,
  closeSearch,
  handleKeyDown,
  saveToHistory,
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const listRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      // Arrow navigation within results
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const results = activeTab === 'proposals' ? filteredProposals : filteredMilestones;
        setSelectedIndex(prev => {
          if (e.key === 'ArrowDown') return Math.min(prev + 1, results.length - 1);
          return Math.max(prev - 1, 0);
        });
      }

      // Enter to select
      if (e.key === 'Enter' && currentResults[selectedIndex]) {
        e.preventDefault();
        const item = currentResults[selectedIndex];
        saveToHistory(query);
        if (activeTab === 'proposals') {
          window.location.hash = `/project/${item.projectId}?proposal=${item.id}`;
        } else {
          window.location.hash = `/gantt?highlight=${item.id}`;
        }
        closeSearch();
      }

      // Tab to switch tabs
      if (e.key === 'Tab') {
        e.preventDefault();
        setActiveTab(prev => prev === 'proposals' ? 'milestones' : 'proposals');
        setSelectedIndex(0);
      }

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, activeTab, selectedIndex, currentResults, query, saveToHistory, closeSearch, setSelectedIndex, setActiveTab]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-search-item]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleHistoryClick = (item) => {
    setQuery(item);
  };

  const handleItemClick = (item) => {
    saveToHistory(query);
    if (activeTab === 'proposals') {
      window.location.hash = `/project/${item.projectId}?proposal=${item.id}`;
    } else {
      window.location.hash = `/gantt?highlight=${item.id}`;
    }
    closeSearch();
  };

  const renderProposalItem = (item, index) => (
    <div
      key={item.id}
      data-search-item
      onClick={() => handleItemClick(item)}
      className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 ${
        index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">
            {item.status === 'completed' ? '✅' :
             item.status === 'in_progress' ? '🔄' :
             item.status === 'pending' ? '⏳' : '📋'}
          </span>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {item.id} · {item.projectName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.tags && item.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
      {item.description && (
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-1 ml-11">
          {item.description}
        </div>
      )}
    </div>
  );

  const renderMilestoneItem = (item, index) => (
    <div
      key={item.id}
      data-search-item
      onClick={() => handleItemClick(item)}
      className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 ${
        index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">
            {item.status === 'completed' ? '🎯' :
             item.status === 'in_progress' ? '🔄' :
             item.status === 'pending' ? '📅' : '📋'}
          </span>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {item.id} · {item.projectId}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.isMilestone && (
            <span className="px-2 py-0.5 text-xs bg-purple-200 dark:bg-purple-800 rounded">
              里程碑
            </span>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">{item.progress}%</span>
        </div>
      </div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-11">
        {item.startDate} → {item.endDate}
      </div>
    </div>
  );

  const results = activeTab === 'proposals' ? filteredProposals : filteredMilestones;
  const showNoResults = query && results.length === 0;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeSearch}
      />

      {/* Modal */}
      <div className="relative flex items-start justify-center pt-[15vh] px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索提案和里程碑..."
              className="flex-1 px-4 py-4 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg"
            />
            <kbd className="hidden sm:inline px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-600">
              ESC
            </kbd>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => { setActiveTab('proposals'); setSelectedIndex(0); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'proposals'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              提案 ({filteredProposals.length})
            </button>
            <button
              onClick={() => { setActiveTab('milestones'); setSelectedIndex(0); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'milestones'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              里程碑 ({filteredMilestones.length})
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto" ref={listRef}>
            {/* Search History */}
            {!query && searchHistory.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 uppercase">
                  最近搜索
                </div>
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleHistoryClick(item)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Results List */}
            {query && results.length > 0 && (
              <div>
                {activeTab === 'proposals'
                  ? filteredProposals.map((item, index) => renderProposalItem(item, index))
                  : filteredMilestones.map((item, index) => renderMilestoneItem(item, index))
                }
              </div>
            )}

            {/* No Results */}
            {showNoResults && (
              <div className="px-4 py-12 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">未找到 "{query}" 相关结果</p>
              </div>
            )}

            {/* Empty State */}
            {!query && searchHistory.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">输入关键词搜索提案和里程碑</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  支持 ID、标题、描述、状态、标签 等字段
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">↓</kbd>
                导航
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd>
                跳转
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Tab</kbd>
                切换
              </span>
            </div>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">⌘</kbd>
              +
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">K</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default GlobalSearch;
