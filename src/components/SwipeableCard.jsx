import { useRef, useState, useCallback } from 'react';

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

function SwipeableCard({ children, onSwipeLeft, onSwipeRight, leftAction, rightAction, disabled = false }) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const cardRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || disabled) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Limit swipe distance
    const maxSwipe = ACTION_WIDTH * 1.5;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setTranslateX(clampedDiff);
    currentXRef.current = currentX;
  }, [isDragging, disabled]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    
    if (translateX > SWIPE_THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (translateX < -SWIPE_THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    
    setTranslateX(0);
  }, [isDragging, translateX, onSwipeLeft, onSwipeRight, disabled]);

  const getActionStyle = (direction) => {
    const isLeft = direction === 'left';
    const opacity = Math.min(Math.abs(translateX) / SWIPE_THRESHOLD, 1);
    const scale = 0.8 + (opacity * 0.2);
    
    return {
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      width: ACTION_WIDTH,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      [isLeft ? 'right' : 'left']: 0,
      backgroundColor: isLeft ? '#ef4444' : '#22c55e', // red-500 or green-500
      color: 'white',
      fontSize: '12px',
      fontWeight: 600,
      opacity,
      transform: `scale(${scale})`,
      transition: isDragging ? 'none' : 'all 0.2s ease-out',
    };
  };

  return (
    <div className="relative overflow-hidden touch-pan-y" ref={cardRef}>
      {/* Left Action (swipe right to reveal) */}
      {leftAction && (
        <div style={getActionStyle('right')}>
          <span>{leftAction}</span>
        </div>
      )}
      
      {/* Right Action (swipe left to reveal) */}
      {rightAction && (
        <div style={getActionStyle('left')}>
          <span>{rightAction}</span>
        </div>
      )}
      
      {/* Card Content */}
      <div
        className={`bg-white dark:bg-gray-800 transition-transform ${isDragging ? '' : 'duration-200'}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default SwipeableCard;
