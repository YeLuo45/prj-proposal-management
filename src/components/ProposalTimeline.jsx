import { useMemo } from 'react'

const STATUS_LABELS = {
  intake: '📥 待 intake',
  clarifying: '💬 澄清中',
  prd_pending_confirmation: '📋 PRD 待确认',
  approved_for_dev: '🚀 已批准开发',
  in_dev: '🔧 开发中',
  in_acceptance: '🔍 验收中',
  accepted: '✅ 已验收',
  archived: '📁 已归档',
}

export default function ProposalTimeline({ proposal }) {
  // Build timeline from activities array or generate from status history
  const activities = useMemo(() => {
    const items = []

    // If proposal has activities array, use it
    if (proposal.activities && proposal.activities.length > 0) {
      return proposal.activities.map(a => ({
        type: a.type || 'status_change',
        from: a.from,
        to: a.to,
        date: a.date || proposal.updatedAt,
        note: a.note || '',
      }))
    }

    // Otherwise generate from status field
    if (proposal.status) {
      items.push({
        type: 'status_change',
        to: proposal.status,
        date: proposal.updatedAt || proposal.createdAt,
        note: '状态更新',
      })
    }

    // Add creation event
    if (proposal.createdAt) {
      items.push({
        type: 'created',
        date: proposal.createdAt,
        note: '提案创建',
      })
    }

    // Sort by date descending (most recent first)
    return items.sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [proposal])

  if (activities.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
        暂无活动时间记录
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">活动时间线</h4>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="relative flex gap-3">
              {/* Icon */}
              <div className={`relative z-10 w-4 h-4 rounded-full flex-shrink-0 ${
                activity.type === 'created' ? 'bg-green-500' :
                activity.type === 'status_change' ? 'bg-blue-500' :
                activity.type === 'comment' ? 'bg-purple-500' :
                'bg-gray-400'
              }`}>
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs">
                  {activity.type === 'created' ? '✚' :
                   activity.type === 'status_change' ? '→' :
                   activity.type === 'comment' ? '💬' : '•'}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  {activity.type === 'status_change' && activity.from && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {STATUS_LABELS[activity.from] || activity.from}
                    </span>
                  )}
                  {activity.type === 'status_change' && activity.from && (
                    <span className="text-xs text-gray-400">→</span>
                  )}
                  {activity.type === 'status_change' && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      activity.to === 'accepted' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' :
                      activity.to === 'in_dev' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                      activity.to === 'archived' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {STATUS_LABELS[activity.to] || activity.to}
                    </span>
                  )}
                  {activity.type === 'created' && (
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {activity.note}
                    </span>
                  )}
                </div>
                {activity.note && activity.type !== 'created' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.note}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
