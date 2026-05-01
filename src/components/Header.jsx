import { useState } from 'react'

export default function Header({ onConfig, showTokenInput, onTokenSave, theme, onToggleTheme }) {
  const [tokenInput, setTokenInput] = useState('')

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">📦 项目管理系统</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors"
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={onConfig} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            {showTokenInput ? '收起' : '⚙️ 配置'}
          </button>
        </div>
      </div>
      {showTokenInput && (
        <div className="max-w-7xl mx-auto px-4 pb-4 flex gap-2">
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="GitHub PAT (ghp_...)"
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            onKeyDown={e => e.key === 'Enter' && onTokenSave(tokenInput)}
          />
          <button onClick={() => onTokenSave(tokenInput)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
            保存
          </button>
        </div>
      )}
    </header>
  )
}
