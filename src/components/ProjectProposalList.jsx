const TYPE_LABELS = { web: '🌐', app: '📱', package: '📦' }
const STATUS_LABELS = {
  active: '✅ Active',
  in_dev: '🔧 开发中',
  archived: '📁 已归档',
  intake: '📥 待 intake',
  clarifying: '💬 澄清中',
  prd_pending_confirmation: '📋 PRD 待确认',
  approved_for_dev: '🚀 已批准开发',
  in_acceptance: '🔍 验收中',
  accepted: '✅ 已验收',
}

export default function ProjectProposalList({ project, onBack, onAddProposal, onEditProposal, onDeleteProposal, onCopy }) {
  if (!project) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>项目不存在</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline dark:text-blue-400">← 返回项目列表</button>
      </div>
    )
  }

  const sortedProposals = [...(project.proposals || [])].sort((a, b) =>
    (b.updatedAt > a.updatedAt ? 1 : -1)
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-blue-600 hover:underline text-sm mb-2 dark:text-blue-400">← 返回项目列表</button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{project.name}</h2>
          <p className="text-gray-600 text-sm mt-1 dark:text-gray-400">{project.description || '无描述'}</p>
        </div>
        <button
          onClick={() => onAddProposal(project)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          + 新增提案
        </button>
      </div>

      {/* Proposals */}
      {sortedProposals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-8 text-center text-gray-500 dark:text-gray-400">
          暂无提案
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProposals.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded shadow hover:shadow-md transition-shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm text-gray-500 dark:text-gray-400">{p.id}</span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{p.name}</span>
                  {p.type && (
                    <span className="text-xl">{TYPE_LABELS[p.type] || '📦'}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    p.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                    p.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                    p.status === 'accepted' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' :
                    p.status === 'in_acceptance' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                    p.status === 'approved_for_dev' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                      🔗 访问
                    </a>
                  )}
                  {p.packageUrl && (
                    <a href={p.packageUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                      📥 下载
                    </a>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3 dark:text-gray-400">{p.description || '无描述'}</p>

              {p.tags && p.tags.length > 0 && (
                <div className="flex gap-1 mb-3 flex-wrap">
                  {p.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                <button onClick={() => onEditProposal(project.id, p)} className="text-blue-600 hover:underline text-sm dark:text-blue-400">编辑</button>
                <button onClick={() => onDeleteProposal(project.id, p.id)} className="text-red-600 hover:underline text-sm dark:text-red-400">删除</button>
                <span className="text-xs text-gray-400 ml-auto dark:text-gray-500">
                  更新于 {p.updatedAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
