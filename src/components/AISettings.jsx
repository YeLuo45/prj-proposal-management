// src/components/AISettings.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAPIKey, setAPIKey } from '../utils/aiService';

export default function AISettings() {
  const { t } = useTranslation();
  const [key, setKey] = useState(getAPIKey());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setAPIKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="font-medium mb-2">🤖 {t('ai.title') || 'AI Settings'}</h3>
      <p className="text-xs text-gray-500 mb-3">
        {t('ai.description') || 'Use MiniMax API Key to enable AI features. Key is stored locally only.'}
      </p>
      <div className="flex gap-2 items-center">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t('ai.placeholder') || 'Enter MiniMax API Key'}
          className="flex-1 border rounded px-3 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
        />
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded text-sm"
        >
          {t('common.save')}
        </button>
        {saved && <span className="text-xs text-green-500">✓ {t('ai.saved') || 'Saved'}</span>}
        {key && !saved && <span className="text-xs text-green-500">✓ {t('ai.configured') || 'Configured'}</span>}
      </div>
    </div>
  );
}
