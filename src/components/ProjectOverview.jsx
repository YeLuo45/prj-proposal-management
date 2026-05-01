const STATUS_CONFIG = {
  intake: { label: '待 intake', color: 'bg-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
  clarifying: { label: '澄清中', color: 'bg-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300' },
  prd_pending_confirmation: { label: 'PRD 待确认', color: 'bg-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  approved_for_dev: { label: '已批准开发', color: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  in_dev: { label: '开发中', color: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  in_acceptance: { label: '验收中', color: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  accepted: { label: '已验收', color: 'bg-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  archived: { label: '已归档', color: 'bg-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
}

export default function ProjectOverview({ project, onClose }) {
  if (!project) return null

  const proposals = project.proposals || []

  // Calculate stats
  const statusCounts = {}
  Object.keys(STATUS_CONFIG).forEach(s => { statusCounts[s] = 0 })
  proposals.forEach(p => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status]++
    } else {
      statusCounts['archived']++
    }
  })

  const activeCount = proposals.filter(p => !['archived', 'accepted'].includes(p.status)).length
  const totalTags = [...new Set(proposals.flatMap(p => p.tags || []))]

  // Recent activity (sorted by updatedAt)
  const recentProposals = [...proposals]
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">项目概览: {project.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">×</button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-3">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{proposals.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">总提案数</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded p-3">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeCount}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">进行中</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 rounded p-3">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{proposals.filter(p => p.status === 'in_acceptance').length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">验收中</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{totalTags.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">使用标签</div>
        </div>
      </div>

      {/* Status distribution bar */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">状态分布</h4>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {Object.entries(statusCounts).map(([status, count]) => {
            if (count === 0) return null
            const config = STATUS_CONFIG[status]
            const pct = proposals.length > 0 ? (count / proposals.length * 100) : 0
            return (
              <div
                key={status}
                className={`${config.color} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${config.label}: ${count}`}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(statusCounts).filter(([, count]) => count > 0).map(([status, count]) => (
            <div key={status} className={`flex items-center gap-1 text-xs ${STATUS_CONFIG[status].text}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].color}`} />
              {STATUS_CONFIG[status].label}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Tags used */}
      {totalTags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">标签 ({totalTags.length})</h4>
          <div className="flex flex-wrap gap-1">
            {totalTags.map(tag => (
              <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">最近更新</h4>
        <div className="space-y-2">
          {recentProposals.map(p => (
            <div key={p.id} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-400">{p.id}</span>
                <span className="text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{p.name}</span>
              </div>
              <span className="text-xs text-gray-400">{p.updatedAt}</span>
            </div>
          ))}
          {recentProposals.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">暂无提案</p>
          )}
        </div>
      </div>
    </div>
  )
}
