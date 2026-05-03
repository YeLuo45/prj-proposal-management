// src/components/AISettings.jsx
import { useState } from 'react';
import { getAPIKey, setAPIKey } from '../utils/aiService';

export default function AISettings() {
  const [key, setKey] = useState(getAPIKey());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setAPIKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="font-medium mb-2">🤖 AI 功能设置</h3>
      <p className="text-xs text-gray-500 mb-3">
        使用 MiniMax API Key 启用 AI 功能。Key 仅存储在本地浏览器，不会上传任何服务器。
      </p>
      <div className="flex gap-2 items-center">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="输入 MiniMax API Key"
          className="flex-1 border rounded px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
        />
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm"
        >
          保存
        </button>
        {saved && <span className="text-xs text-green-500">✓ 已保存</span>}
        {key && !saved && <span className="text-xs text-green-500">✓ 已配置</span>}
      </div>
    </div>
  );
}
