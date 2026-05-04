import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const SEARCH_HISTORY_KEY = 'proposal_search_history';
const MAX_HISTORY = 5;

function SearchBar({ value, onChange, onAdvancedClick, showAdvanced }) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue && localValue.trim()) {
        onChange(localValue.trim());
        saveToHistory(localValue.trim());
      } else {
        onChange(localValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (query) => {
    const filtered = history.filter(h => h !== query);
    const updated = [query, ...filtered].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  const handleHistoryClick = (item) => {
    setLocalValue(item);
    onChange(item);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  return (
    <div className="flex-1 relative flex gap-2">
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setShowHistory(true)}
          placeholder={t('searchBar.placeholder')}
          className="w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {localValue && (
            <button
              onClick={() => {
                setLocalValue('');
                onChange('');
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
          <kbd className="hidden lg:inline text-xs text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">Ctrl+F</kbd>
        </div>
      </div>

      {history.length > 0 && showHistory && (
        <div
          ref={historyRef}
          className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('searchBar.searchHistory')}</span>
            <button onClick={clearHistory} className="text-xs text-blue-500 hover:text-blue-600">
              {t('searchBar.clear')}
            </button>
          </div>
          {history.map((item, i) => (
            <button
              key={i}
              onClick={() => handleHistoryClick(item)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onAdvancedClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
          showAdvanced
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {t('advancedFilter.title') || '高级'}
      </button>
    </div>
  );
}

export default SearchBar;
