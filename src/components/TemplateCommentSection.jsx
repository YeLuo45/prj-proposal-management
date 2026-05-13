import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getComments, addComment, updateComment, deleteComment } from '../services/templateMarketplaceService';
import TemplateRating from './TemplateRating';

/**
 * V30+: Template Comment Section
 * Displays and manages comments/reviews for a template
 */
function TemplateCommentSection({ templateId, templateName, onClose }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [templateId]);

  const loadComments = () => {
    setLoading(true);
    setComments(getComments(templateId));
    setLoading(false);
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    const result = addComment(templateId, newComment, newRating || null);
    if (result.success) {
      setComments([result.comment, ...comments]);
      setNewComment('');
      setNewRating(0);
      setShowRatingInput(false);
    }
  };

  const handleUpdate = (commentId) => {
    if (!editText.trim()) return;
    const result = updateComment(templateId, commentId, editText);
    if (result.success) {
      setComments(comments.map(c => c.id === commentId ? result.comment : c));
      setEditingId(null);
      setEditText('');
    }
  };

  const handleDelete = (commentId) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    const result = deleteComment(templateId, commentId);
    if (result.success) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        评论 ({comments.length})
      </h3>

      {/* Add comment form */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="分享你对「{templateName}」的使用体验..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">评分：</span>
            <TemplateRating
              value={newRating}
              size="md"
              interactive
              showInput={showRatingInput}
              onShowInput={setShowRatingInput}
              onRate={(r) => { setNewRating(r); setShowRatingInput(false); }}
            />
            {newRating > 0 && (
              <span className="text-sm text-amber-500">{newRating} 星</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发布评论
          </button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-gray-500 dark:text-gray-400">还没有人评论过这个模板</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">成为第一个评论者吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              {editingId === comment.id ? (
                // Edit mode
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      disabled={!editText.trim()}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <>
                  {/* Comment header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-300 text-sm font-medium">
                          {comment.text.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          用户 {comment.id.split('_')[1]}
                        </div>
                        <div className="text-xs text-gray-400">{formatDate(comment.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {comment.rating && (
                        <TemplateRating value={comment.rating} size="sm" />
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="p-1 text-gray-400 hover:text-indigo-500 rounded"
                          title="编辑"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                          title="删除"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comment text */}
                  <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {comment.text}
                  </p>
                  
                  {/* Updated indicator */}
                  {comment.updatedAt !== comment.createdAt && (
                    <div className="text-xs text-gray-400 mt-2">
                      已编辑 {formatDate(comment.updatedAt)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplateCommentSection;
