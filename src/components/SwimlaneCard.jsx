import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef, useState, useCallback } from 'react';

const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 70;

function SwimlaneCard({ proposal, onClick, isDragging, onSwipeLeft, onSwipeRight }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: proposal.id });

  const [translateX, setTranslateX] = useState(0);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  const startXRef = useRef(0);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Touch handlers for swipe actions
  const handleTouchStart = useCallback((e) => {
    // Only track horizontal movements
    startXRef.current = e.touches[0].clientX;
    setIsDraggingTouch(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDraggingTouch) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Limit swipe distance
    const maxSwipe = ACTION_WIDTH * 1.5;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setTranslateX(clampedDiff);
  }, [isDraggingTouch]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingTouch) return;
    setIsDraggingTouch(false);
    
    if (translateX > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight(proposal);
    } else if (translateX < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft(proposal);
    }
    
    setTranslateX(0);
  }, [isDraggingTouch, translateX, onSwipeLeft, onSwipeRight, proposal]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'in_dev':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived':
      case 'completed':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'web':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'app':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'feature':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

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
      backgroundColor: isLeft ? '#ef4444' : '#22c55e',
      color: 'white',
      fontSize: '11px',
      fontWeight: 600,
      opacity,
      transform: `scale(${scale})`,
      transition: isDraggingTouch ? 'none' : 'all 0.2s ease-out',
      pointerEvents: 'none',
    };
  };

  const cardContent = (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 break-words">
          {proposal.name}
        </h4>
        <span className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${getStatusColor(proposal.status)}`}>
          {proposal.status === 'active' ? '待办' : proposal.status === 'in_dev' ? '进行中' : proposal.status === 'archived' ? '已归档' : '完成'}
        </span>
      </div>
      {proposal.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {proposal.description}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {proposal.type && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${getTypeColor(proposal.type)}`}>
              {proposal.type}
            </span>
          )}
          {proposal.priority && (
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              proposal.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
              proposal.priority === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
              'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {proposal.priority === 'high' ? '高' : proposal.priority === 'medium' ? '中' : '低'}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {proposal.id}
        </span>
      </div>
    </div>
  );

  if (isDragging) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border-2 border-blue-400 opacity-90 rotate-2">
        {cardContent}
      </div>
    );
  }

  // Mobile: Show swipe actions
  const showSwipeActions = onSwipeLeft || onSwipeRight;

  if (showSwipeActions) {
    return (
      <div className="relative overflow-hidden">
        {/* Left Action (swipe right to reveal) */}
        {onSwipeRight && (
          <div style={getActionStyle('right')}>
            <span>编辑</span>
          </div>
        )}
        
        {/* Right Action (swipe left to reveal) */}
        {onSwipeLeft && (
          <div style={getActionStyle('left')}>
            <span>删除</span>
          </div>
        )}
        
        {/* Card Content */}
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          onClick={onClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="bg-white dark:bg-gray-800 transition-transform"
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      {cardContent}
    </div>
  );
}

export default SwimlaneCard;
