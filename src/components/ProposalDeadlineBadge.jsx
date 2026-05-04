import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ProposalDeadlineBadge - Displays deadline with visual highlighting
 * 
 * Features:
 * - Expired deadline (past due) - Red highlighting with pulsing animation
 * - Approaching deadline (within warning threshold) - Yellow/Orange highlighting
 * - Normal deadline - Neutral gray styling
 * 
 * @param {Object} props
 * @param {string} props.deadline - ISO date string (e.g., "2026-05-15")
 * @param {string} props.variant - 'badge' | 'chip' | 'inline' | 'card'
 * @param {boolean} props.showIcon - Show calendar icon
 * @param {boolean} props.showDaysLeft - Show days remaining
 */
function ProposalDeadlineBadge({ 
  deadline, 
  variant = 'badge',
  showIcon = true,
  showDaysLeft = true,
  className = '',
}) {
  const { t } = useTranslation();

  // Calculate deadline status
  const deadlineInfo = useMemo(() => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDay = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
    
    const diffTime = deadlineDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Thresholds
    const EXPIRED_THRESHOLD = 0; // days <= 0 is expired
    const URGENT_THRESHOLD = 3; // days <= 3 is urgent
    const WARNING_THRESHOLD = 7; // days <= 7 is warning

    let status = 'normal'; // normal, warning, urgent, expired
    if (diffDays < EXPIRED_THRESHOLD) {
      status = 'expired';
    } else if (diffDays <= URGENT_THRESHOLD) {
      status = 'urgent';
    } else if (diffDays <= WARNING_THRESHOLD) {
      status = 'warning';
    }

    return {
      diffDays,
      status,
      formattedDate: deadlineDate.toLocaleDateString(),
      isOverdue: diffDays < 0,
      isToday: diffDays === 0,
    };
  }, [deadline]);

  if (!deadline || !deadlineInfo) {
    return null;
  }

  // Style variants
  const variantStyles = {
    badge: {
      normal: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      urgent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse',
    },
    chip: {
      normal: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full',
      urgent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full',
      expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full animate-pulse',
    },
    inline: {
      normal: 'text-gray-500 dark:text-gray-400',
      warning: 'text-yellow-600 dark:text-yellow-400 font-medium',
      urgent: 'text-orange-600 dark:text-orange-400 font-semibold',
      expired: 'text-red-600 dark:text-red-400 font-bold',
    },
    card: {
      normal: 'border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800',
      warning: 'border border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
      urgent: 'border border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20',
      expired: 'border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/30 shadow-md',
    },
  };

  const styles = variantStyles[variant] || variantStyles.badge;
  const styleClass = styles[deadlineInfo.status];

  // Icon
  const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  // Warning icon for approaching/expired deadlines
  const WarningIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  // Get label text
  const getLabel = () => {
    const { diffDays, isOverdue, isToday } = deadlineInfo;
    
    if (isOverdue) {
      return t('deadline.overdue', { days: Math.abs(diffDays) });
    }
    if (isToday) {
      return t('deadline.today');
    }
    if (diffDays === 1) {
      return t('deadline.tomorrow');
    }
    if (diffDays <= 7) {
      return t('deadline.daysLeft', { days: diffDays });
    }
    return deadlineInfo.formattedDate;
  };

  // Content
  const content = (
    <span className="inline-flex items-center gap-1">
      {showIcon && (
        <span className="flex-shrink-0">
          {deadlineInfo.status !== 'normal' ? <WarningIcon /> : <CalendarIcon />}
        </span>
      )}
      <span>{getLabel()}</span>
      {showDaysLeft && deadlineInfo.status !== 'normal' && !isToday && (
        <span className="text-xs opacity-75">
          ({deadlineInfo.formattedDate})
        </span>
      )}
    </span>
  );

  // Render based on variant
  if (variant === 'inline') {
    return (
      <span className={`${styleClass} ${className}`} title={`Deadline: ${deadlineInfo.formattedDate}`}>
        {content}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-2 rounded-lg ${styleClass} ${className}`}>
        <div className="text-xs font-medium mb-1">{t('deadline.deadline') || 'Deadline'}</div>
        <div className="text-sm">{content}</div>
      </div>
    );
  }

  // badge or chip variant
  return (
    <span 
      className={`inline-flex items-center px-2 py-1 text-xs font-medium ${styleClass} ${className}`}
      title={`Deadline: ${deadlineInfo.formattedDate}`}
    >
      {content}
    </span>
  );
}

export default ProposalDeadlineBadge;
