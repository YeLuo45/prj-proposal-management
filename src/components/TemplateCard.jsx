import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isFavorite, toggleFavorite, rateTemplate, getUserRating, recordTemplateUsage } from '../services/templateMarketplaceService';
import TemplateRating from './TemplateRating';

/**
 * V30: Template Card Component
 * Displays a template preview with rating, favorite, and quick actions
 */
function TemplateCard({
  template,
  onApply,
  onPreview,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
}) {
  const { t } = useTranslation();
  const [favorited, setFavorited] = useState(() => isFavorite(template.id));
  const [userRating, setUserRating] = useState(() => getUserRating(template.id));
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleFavorite = (e) => {
    e.stopPropagation();
    const result = toggleFavorite(template.id);
    if (result.success) {
      setFavorited(!favorited);
    }
  };

  const handleRate = (rating) => {
    const result = rateTemplate(template.id, rating);
    if (result.success) {
      setUserRating(rating);
      setShowRatingInput(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await recordTemplateUsage(template.id);
      if (onApply) onApply(template);
    } finally {
      setIsApplying(false);
    }
  };

  const handleQuickEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(template);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(template.id);
  };

  const getCategoryBadgeColor = (category) => {
    const colors = {
      agile: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      project: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      product: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      bug: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      research: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      marketing: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      infrastructure: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      documentation: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    };
    return colors[category] || colors.agile;
  };

  const getCategoryName = (category) => {
    const names = {
      agile: '敏捷开发',
      project: '项目管理',
      product: '产品管理',
      bug: 'Bug追踪',
      research: '技术研究',
      marketing: '市场营销',
      infrastructure: '运维管理',
      documentation: '文档编写',
    };
    return names[category] || category;
  };

  const getWorkflowBadge = (workflow) => {
    const badges = {
      kanban: { bg: 'bg-gray-500', text: '看板' },
      scrum: { bg: 'bg-blue-500', text: 'Scrum' },
      bug_flow: { bg: 'bg-red-500', text: 'Bug流程' },
      review: { bg: 'bg-purple-500', text: '审核流' },
      simple: { bg: 'bg-green-500', text: '简单流' },
    };
    return badges[workflow] || badges.kanban;
  };

  if (compact) {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleApply}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-800 dark:text-gray-100 truncate">
                {template.name}
              </h4>
              {template.isBuiltin && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded">
                  预设
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
              {template.description}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <TemplateRating value={template.rating} size="sm" />
              <span className="text-xs text-gray-400">
                {template.usageCount?.toLocaleString() || 0} 使用
              </span>
            </div>
          </div>
          
          <button
            onClick={handleFavorite}
            className={`p-1 ${favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with category color */}
      <div className={`h-2 ${
        template.category === 'agile' ? 'bg-blue-500' :
        template.category === 'bug' ? 'bg-red-500' :
        template.category === 'product' ? 'bg-pink-500' :
        template.category === 'project' ? 'bg-purple-500' :
        template.category === 'marketing' ? 'bg-orange-500' :
        template.category === 'infrastructure' ? 'bg-gray-500' :
        template.category === 'documentation' ? 'bg-green-500' :
        'bg-indigo-500'
      }`} />
      
      <div className="p-4">
        {/* Top row: badges and favorite */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryBadgeColor(template.category)}`}>
              {getCategoryName(template.category)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getWorkflowBadge(template.workflow).bg} text-white`}>
              {getWorkflowBadge(template.workflow).text}
            </span>
            {template.isBuiltin && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                预设
              </span>
            )}
            {template.isCustom && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                自定义
              </span>
            )}
          </div>
          
          <button
            onClick={handleFavorite}
            className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
              favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            } transition-colors`}
            title={favorited ? '取消收藏' : '收藏'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Title and description */}
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-1">
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-1">
            <TemplateRating 
              value={template.rating} 
              size="sm" 
              interactive 
              userRating={userRating}
              onRate={handleRate}
              showInput={showRatingInput}
              onShowInput={setShowRatingInput}
            />
            <span className="text-gray-500 dark:text-gray-400 text-xs ml-1">
              ({template.ratingCount || 0})
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">{template.usageCount?.toLocaleString() || 0}</span>
          </div>
        </div>

        {/* Column preview */}
        <div className="mb-3">
          <div className="flex items-center gap-1 flex-wrap">
            {(template.columns || []).slice(0, 4).map((col, idx) => (
              <span
                key={col.id || idx}
                className={`text-xs px-2 py-0.5 rounded ${col.color || 'bg-gray-400'} text-white`}
              >
                {col.title.split(' ')[0]}
              </span>
            ))}
            {(template.columns?.length || 0) > 4 && (
              <span className="text-xs text-gray-400">
                +{template.columns.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {template.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{template.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isApplying ? '应用中...' : '应用模板'}
            </button>
            {onPreview && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreview(template); }}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                title="预览"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            {onEdit && !template.isBuiltin && (
              <button
                onClick={handleQuickEdit}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                title="编辑"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && !template.isBuiltin && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-colors"
                title="删除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Author and version */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400 dark:text-gray-500">
          <span>作者: {template.author || '系统'}</span>
          <span>v{template.version || '1.0'}</span>
        </div>
      </div>
    </div>
  );
}

export default TemplateCard;
