import { useState, useEffect, useRef } from 'react'

const HISTORY_KEY = 'proposals-search-history'
const MAX_HISTORY = 10

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function addToHistory(term) {
  if (!term.trim()) return
  const history = getHistory().filter(h => h !== term)
  history.unshift(term)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}

// Simple fuzzy match - checks if all characters appear in order (not necessarily contiguous)
function fuzzyMatch(text, pattern) {
  if (!pattern) return true
  const t = text.toLowerCase()
  const p = pattern.toLowerCase()
  let ti = 0
  for (let i = 0; i < p.length && ti < t.length; i++) {
    const idx = t.indexOf(p[i], ti)
    if (idx === -1) return false
    ti = idx + 1
  }
  return true
}

export default function SearchBar({ value, onChange, onFuzzyMatch }) {
  const [local, setLocal] = useState(value)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const inputRef = useRef(null)
  const historyRef = useRef(null)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const t = setTimeout(() => {
      onChange(local)
      if (onFuzzyMatch) {
        onFuzzyMatch(local)
      }
      // Add to history on submit (when user presses Enter or searches)
      if (local.trim()) {
        addToHistory(local.trim())
        setHistory(getHistory())
      }
    }, 300)
    return () => clearTimeout(t)
  }, [local, onChange, onFuzzyMatch])

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  // Close history dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (historyRef.current && !historyRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleHistoryClick = (term) => {
    setLocal(term)
    setShowHistory(false)
    onChange(term)
    if (onFuzzyMatch) onFuzzyMatch(term)
  }

  const clearHistory = (e) => {
    e.stopPropagation()
    localStorage.removeItem(HISTORY_KEY)
    setHistory([])
  }

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onFocus={() => setShowHistory(true)}
        placeholder="🔍 搜索名称、描述或标签（支持模糊匹配）..."
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
      />
      {showHistory && history.length > 0 && (
        <div
          ref={historyRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-600">
            <span className="text-xs text-gray-500 dark:text-gray-400">搜索历史</span>
            <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700">清除</button>
          </div>
          {history.map((term, i) => (
            <button
              key={i}
              onClick={() => handleHistoryClick(term)}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <span className="text-gray-400">🕐</span>
              <span className="truncate">{term}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { fuzzyMatch }
