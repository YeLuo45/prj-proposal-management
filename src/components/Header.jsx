import { useState } from 'react'

export default function Header({ onConfig, showTokenInput, onTokenSave }) {
  const [tokenInput, setTokenInput] = useState('')

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">📦 提案管理系统</h1>
        <button onClick={onConfig} className="text-sm text-blue-600 hover:underline">
          {showTokenInput ? '收起' : '⚙️ 配置'}
        </button>
      </div>
      {showTokenInput && (
        <div className="max-w-7xl mx-auto px-4 pb-4 flex gap-2">
          <input
            type="password"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            placeholder="GitHub PAT (ghp_...)"
            className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
            onKeyDown={e => e.key === 'Enter' && onTokenSave(tokenInput)}
          />
          <button onClick={() => onTokenSave(tokenInput)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
            保存
          </button>
        </div>
      )}
    </header>
  )
}
