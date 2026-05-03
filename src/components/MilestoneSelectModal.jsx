import { useState } from 'react';

function MilestoneSelectModal({ milestones, onSelect, onClose }) {
  const [search, setSearch] = useState('');

  const filteredMilestones = milestones.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">选择里程碑</h3>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索里程碑..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
          {filteredMilestones.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              没有找到匹配的里程碑
            </div>
          ) : (
            filteredMilestones.map(m => (
              <button
                key={m.id}
                onClick={() => onSelect(m.id, m.name)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-800 dark:text-gray-200">{m.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {m.id} · {m.startDate} ~ {m.endDate}
                </div>
              </button>
            ))
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}

export default MilestoneSelectModal;
