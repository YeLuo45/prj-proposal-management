import { useMemo } from 'react'

const STATUS_CONFIG = {
  intake: { label: '待 intake', color: 'bg-gray-500' },
  clarifying: { label: '澄清中', color: 'bg-yellow-500' },
  prd_pending_confirmation: { label: 'PRD 待确认', color: 'bg-orange-500' },
  approved_for_dev: { label: '已批准开发', color: 'bg-green-500' },
  in_dev: { label: '开发中', color: 'bg-blue-500' },
  in_acceptance: { label: '验收中', color: 'bg-purple-500' },
  accepted: { label: '已验收', color: 'bg-teal-500' },
  archived: { label: '已归档', color: 'bg-slate-500' },
}

export default function Dashboard({ projects }) {
  const stats = useMemo(() => {
    const allProposals = projects.flatMap(p => p.proposals || [])

    // Basic counts
    const totalProjects = projects.length
    const totalProposals = allProposals.length

    // Status distribution
    const statusCounts = {}
    Object.keys(STATUS_CONFIG).forEach(s => { statusCounts[s] = 0 })
    allProposals.forEach(p => {
      if (statusCounts[p.status] !== undefined) {
        statusCounts[p.status]++
      } else {
        statusCounts['archived']++
      }
    })

    // Active proposals (not archived or accepted)
    const activeProposals = allProposals.filter(p => !['archived', 'accepted'].includes(p.status)).length

    // Tag frequency
    const tagCounts = {}
    allProposals.forEach(p => {
      ;(p.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Project activity (proposals per project)
    const projectProposalCounts = projects.map(p => ({
      name: p.name,
      count: p.proposals?.length || 0
    })).sort((a, b) => b.count - a.count)

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentProposals = allProposals.filter(p => {
      if (!p.updatedAt) return false
      return new Date(p.updatedAt) >= thirtyDaysAgo
    })

    // Activity by day (last 14 days)
    const activityByDay = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = allProposals.filter(p => p.updatedAt === dateStr).length
      activityByDay.push({ date: dateStr, count })
    }

    // Type distribution
    const typeCounts = { web: 0, app: 0, package: 0 }
    allProposals.forEach(p => {
      if (typeCounts[p.type] !== undefined) {
        typeCounts[p.type]++
      }
    })

    return {
      totalProjects,
      totalProposals,
      activeProposals,
      statusCounts,
      topTags,
      projectProposalCounts,
      recentProposals,
      activityByDay,
      typeCounts,
    }
  }, [projects])

  const maxDayCount = Math.max(...stats.activityByDay.map(d => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">数据分析</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          共 {stats.totalProjects} 个项目，{stats.totalProposals} 个提案
        </span>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalProjects}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">项目总数</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalProposals}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">提案总数</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.activeProposals}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">进行中</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.recentProposals.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">30天内更新</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">状态分布</h3>
          <div className="space-y-2">
            {Object.entries(stats.statusCounts).filter(([, count]) => count > 0).map(([status, count]) => {
              const config = STATUS_CONFIG[status]
              const pct = stats.totalProposals > 0 ? (count / stats.totalProposals * 100) : 0
              return (
                <div key={status} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${config.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-24">{config.label}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${config.color} rounded-full h-2 transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tag ranking */}
        <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">标签热度 TOP10</h3>
          {stats.topTags.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">暂无标签数据</p>
          ) : (
            <div className="space-y-2">
              {stats.topTags.map(([tag, count], index) => (
                <div key={tag} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{tag}</span>
                  <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2"
                      style={{ width: `${(count / stats.topTags[0][1]) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity trend */}
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">更新趋势（近14天）</h3>
        <div className="flex items-end gap-1 h-32">
          {stats.activityByDay.map(({ date, count }) => {
            const height = (count / maxDayCount) * 100
            const dayLabel = new Date(date).getDate()
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  {count > 0 && (
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                      title={`${date}: ${count}个提案`}
                    />
                  )}
                </div>
                <span className="text-xs text-gray-400">{dayLabel}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Project proposal counts */}
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">项目提案数量</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.projectProposalCounts.map(({ name, count }) => (
            <div key={name} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="text-2xl">📁</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{count} 个提案</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type distribution */}
      <div className="bg-white dark:bg-gray-800 rounded shadow p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-4 text-gray-800 dark:text-white">类型分布</h3>
        <div className="flex gap-6">
          {Object.entries(stats.typeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="text-2xl">{type === 'web' ? '🌐' : type === 'app' ? '📱' : '📦'}</span>
              <div>
                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{count}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {type === 'web' ? 'Web' : type === 'app' ? 'App' : 'Package'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
