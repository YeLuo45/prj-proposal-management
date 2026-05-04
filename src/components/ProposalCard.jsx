import { useTranslation } from 'react-i18next';
import ProposalDeadlineBadge from './ProposalDeadlineBadge';
import { useRef, useState, useCallback } from 'react';

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 70;

function highlightText(text, query) {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">{part}</mark> : part
  );
}

function ProposalCard({ proposal, onEdit, onDelete, onCopyUrl, searchQuery, selectedIds, onToggleSelect }) {
  const { t } = useTranslation();
  const typeColors = {
    web: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    app: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    package: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    in_dev: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  // Swipe state
  const [translateX, setTranslateX] = useState(0);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  const startXRef = useRef(0);

  const handleTouchStart = useCallback((e) => {
    startXRef.current = e.touches[0].clientX;
    setIsDraggingTouch(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingTouch) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    const maxSwipe = ACTION_WIDTH * 1.5;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setTranslateX(clampedDiff);
  }, [isDraggingTouch]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingTouch) return;
    setIsDraggingTouch(false);
    
    if (translateX > SWIPE_THRESHOLD && onEdit) {
      onEdit();
    } else if (translateX < -SWIPE_THRESHOLD && onDelete) {
      onDelete();
    }
    setTranslateX(0);
  }, [isDraggingTouch, translateX, onEdit, onDelete]);

  const getActionStyle = (direction) => {
    const isLeft = direction === 'left';
    const opacity = Math.min(Math.abs(translateX) / SWIPE_THRESHOLD, 1);
    const scale = 0.8 + (opacity * 0.2);
    
    return {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: ACTION_WIDTH,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      [isLeft ? 'right' : 'left']: 0,
      backgroundColor: isLeft ? '#ef4444' : '#3b82f6', // red-500 or blue-500
      color: 'white',
      fontSize: '12px',
      fontWeight: 600,
      opacity,
      transform: `scale(${scale})`,
      transition: isDraggingTouch ? 'none' : 'all 0.2s ease-out',
      pointerEvents: 'none',
    };
  };

  const query = searchQuery || '';
  const isSelected = selectedIds?.has(proposal.id);

  const cardContent = (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow border touch-pan-y ${
      isSelected
        ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-start gap-2 md:gap-3 mb-4">
        <input
          type="checkbox"
          checked={isSelected || false}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(proposal.id);
          }}
          className="mt-1 w-4 h-4 text-blue-500 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
        />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">{highlightText(proposal.id, query)}</span>
          <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100">{highlightText(proposal.name, query)}</h3>
        </div>
        <div className="flex gap-1 md:gap-2">
          <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs ${typeColors[proposal.type] || ''}`}>
            {t(`type.${proposal.type}`)}
          </span>
          <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs ${statusColors[proposal.status] || ''}`}>
            {t(`status.${proposal.status}`)}
          </span>
          {proposal.deadline && (
            <ProposalDeadlineBadge deadline={proposal.deadline} variant="chip" />
          )}
        </div>
      </div>

      {proposal.description && (
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm md:text-base">{highlightText(proposal.description, query)}</p>
      )}

      {proposal.projectName && (
        <div className="text-xs md:text-sm text-indigo-600 dark:text-indigo-400 mb-2 font-medium">
          {t('projectInfo.project')}: {highlightText(proposal.projectName, query)}
        </div>
      )}

      {(proposal.gitRepo || proposal.url || proposal.owner) && (
        <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2 space-y-1">
          {proposal.gitRepo && <div>{t('proposalCard.repo') || 'Repo'}: {highlightText(proposal.gitRepo, query)}</div>}
          {proposal.url && <div>URL: {highlightText(proposal.url, query)}</div>}
          {proposal.owner && <div>{t('proposalCard.owner') || 'Owner'}: {highlightText(proposal.owner, query)}</div>}
        </div>
      )}

      {proposal.tags && proposal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 md:gap-2 mb-4">
          {proposal.tags.map((tag, index) => (
            <span key={index} className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
              {highlightText(tag, query)}
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 hidden md:block">
        {t('proposalCard.createdAt')}: {proposal.createdAt} | {t('proposalCard.updatedAt')}: {proposal.updatedAt}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(proposal.id);
            alert(`${t('proposalCard.idCopied') || 'ID'} ${proposal.id} ${t('proposalCard.copied') || 'copied'}`);
          }}
          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
        >
          {t('proposalCard.copyId') || '复制编号'}
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(proposal.name);
            alert(`${t('proposalCard.nameCopied') || 'Name'} ${proposal.name} ${t('proposalCard.copied') || 'copied'}`);
          }}
          className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
        >
          {t('proposalCard.copyName') || '复制名称'}
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        {proposal.url && (
          <button
            onClick={() => window.open(proposal.url, '_blank')}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
          >
            {t('proposalCard.visit') || '访问'}
          </button>
        )}
        {proposal.gitRepo && (
          <button
            onClick={() => window.open(proposal.gitRepo, '_blank')}
            className="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600 text-sm"
          >
            {t('proposalCard.repo') || '仓库'}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
        >
          {t('common.edit') || '编辑'}
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-sm"
        >
          {t('common.delete') || '删除'}
        </button>
      </div>
    </div>
  );

  // On mobile, wrap card with swipeable container
  return (
    <div className="relative overflow-hidden md:relative md:overflow-visible">
      {/* Swipe action hints */}
      {onEdit && (
        <div style={getActionStyle('right')} className="md:hidden">
          <span>编辑</span>
        </div>
      )}
      {onDelete && (
        <div style={getActionStyle('left')} className="md:hidden">
          <span>删除</span>
        </div>
      )}
      
      {/* Card Content with swipe */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-white dark:bg-gray-800 transition-transform md:transition-none"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDraggingTouch ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {cardContent}
      </div>
    </div>
  );
}

export default ProposalCard;
