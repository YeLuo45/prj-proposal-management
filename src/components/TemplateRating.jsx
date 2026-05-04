import { useState } from 'react';

/**
 * V30: Template Rating Component
 * Displays and handles template ratings with star display and interactive input
 */
function TemplateRating({
  value = 0,
  max = 5,
  size = 'md',
  interactive = false,
  userRating = null,
  onRate = null,
  showInput = false,
  onShowInput = null,
  className = '',
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  };

  const displayValue = hoverRating || userRating || value;

  const handleClick = (rating) => {
    if (interactive && onRate) {
      onRate(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (interactive) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  // Render star SVG
  const renderStar = (index) => {
    const filled = index <= displayValue;
    const halfFilled = !filled && index - 0.5 <= displayValue && displayValue < index;
    
    return (
      <svg
        key={index}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={halfFilled ? 0 : 2}
        className={`${sizeClasses[size]} ${interactive ? 'cursor-pointer transition-colors' : ''} ${
          filled ? 'text-amber-400' : halfFilled ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
        }`}
        onClick={() => handleClick(index)}
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={handleMouseLeave}
      >
        {halfFilled ? (
          // Half star
          <>
            <defs>
              <linearGradient id={`half-${index}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#half-${index})`}
              stroke="currentColor"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </>
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        )}
      </svg>
    );
  };

  // Simple display mode
  if (!interactive && !showInput) {
    return (
      <div className={`flex items-center ${gapClasses[size]} ${className}`}>
        {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
        {size !== 'sm' && (
          <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
            {value.toFixed(1)}
          </span>
        )}
      </div>
    );
  }

  // Interactive mode with click-to-rate
  if (interactive && onRate && !showInput) {
    return (
      <div 
        className={`flex items-center ${gapClasses[size]} ${className}`}
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
        {userRating && size !== 'sm' && (
          <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
            (你的: {userRating})
          </span>
        )}
      </div>
    );
  }

  // Show input mode - more detailed interactive rating
  if (showInput || interactive) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div 
          className={`flex items-center ${gapClasses[size]}`}
          onMouseLeave={handleMouseLeave}
        >
          {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
        </div>
        {showInput && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onShowInput?.(false)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              取消
            </button>
            <span className="text-xs text-gray-400">
              点击星星评分
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
}

/**
 * Compact rating display for inline use
 */
export function RatingBadge({ value, count, size = 'sm' }) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]} text-gray-600 dark:text-gray-400`}>
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-amber-400`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span>{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-gray-400">({count})</span>
      )}
    </div>
  );
}

export default TemplateRating;
