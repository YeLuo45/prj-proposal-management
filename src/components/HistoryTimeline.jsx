import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * HistoryTimeline - V20 Collaboration Enhancement
 * Displays a timeline of history records grouped by date
 */
function HistoryTimeline({ history = [], onRecordClick }) {
  const { t } = useTranslation();
  const [expandedRecords, setExpandedRecords] = useState(new Set());

  const toggleExpand = (recordId) => {
    setExpandedRecords(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return (
          <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 flex items-center justify-center text-xs font-bold">
            +
          </span>
        );
      case 'update':
        return (
          <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
            ~
          </span>
        );
      case 'delete':
        return (
          <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 flex items-center justify-center text-xs font-bold">
            ×
          </span>
        );
      default:
        return null;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'text-green-600 dark:text-green-400';
      case 'update':
        return 'text-blue-600 dark:text-blue-400';
      case 'delete':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) {
      return '今天';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    }
  };

  // Group by date
  const groupedByDate = {};
  history.forEach(record => {
    const date = record.timestamp?.split('T')[0];
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(record);
  });

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-4">📋</div>
        <div>暂无历史记录</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, records]) => (
        <div key={date}>
          {/* Date Header */}
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {formatDate(date)}
            </span>
            <span>{records.length} 条记录</span>
          </div>

          {/* Records */}
          <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
            {records.map((record) => {
              const isExpanded = expandedRecords.has(record.id);
              const hasChanges = record.changes && Object.keys(record.changes).length > 0;

              return (
                <div
                  key={record.id}
                  className="relative pl-6"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1 -translate-x-1/2">
                    {getActionIcon(record.action)}
                  </div>

                  {/* Content */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${getActionColor(record.action)}`}>
                            {record.action === 'create' && '创建'}
                            {record.action === 'update' && '更新'}
                            {record.action === 'delete' && '删除'}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                            {record.entityType === 'proposal' && '提案'}
                            {record.entityType === 'milestone' && '里程碑'}
                            {record.entityType === 'project' && '项目'}
                          </span>
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-200 truncate">
                          {record.entityName || record.entityId}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTime(record.timestamp)}
                        </div>
                      </div>

                      {hasChanges && (
                        <button
                          onClick={() => toggleExpand(record.id)}
                          className="text-xs text-blue-500 hover:text-blue-600 px-2 py-1"
                        >
                          {isExpanded ? '收起' : '详情'}
                        </button>
                      )}
                    </div>

                    {/* Changes detail */}
                    {isExpanded && hasChanges && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="space-y-2 text-sm">
                          {Object.entries(record.changes).map(([key, change]) => (
                            <div key={key}>
                              <span className="text-gray-500 dark:text-gray-400">{key}: </span>
                              <span className="line-through text-red-500 dark:text-red-400">
                                {JSON.stringify(change.from)}
                              </span>
                              <span className="text-gray-400 mx-1">→</span>
                              <span className="text-green-600 dark:text-green-400">
                                {JSON.stringify(change.to)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default HistoryTimeline;
