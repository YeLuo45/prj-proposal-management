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

export default function ProjectCard({ project: prj, viewMode, onSelectProject, onEditProject, onDeleteProject, onAddProposal, onEditProposal, onDeleteProposal, onCopy }) {
  // Latest proposal (most recent by updatedAt)
  const latestProposal = prj.proposals?.length
    ? [...prj.proposals].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))[0]
    : null

  if (viewMode === 'table') {
    return (
      <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
        <td className="py-2 px-3 font-mono text-sm text-gray-700 dark:text-gray-300">{prj.id}</td>
        <td className="py-2 px-3 font-medium">
          <button onClick={() => onSelectProject(prj.id)} className="text-blue-600 hover:underline text-left dark:text-blue-400">
            {prj.name}
          </button>
        </td>
        <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{prj.description}</td>
        <td className="py-2 px-3 text-sm">
          {latestProposal
            ? <button onClick={() => onSelectProject(prj.id)} className="text-left hover:underline dark:text-gray-300">
                <span className="font-mono text-xs text-gray-400 mr-1">{latestProposal.id}</span>
                <span className="text-gray-600 dark:text-gray-400">{prj.proposals?.length || 0} 个提案</span>
              </button>
            : <span className="text-gray-600 dark:text-gray-400">{prj.proposals?.length || 0} 个提案</span>}
        </td>
        <td className="py-2 px-3">
          {prj.url && (
            <a href={prj.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mr-2 dark:text-blue-400">访问</a>
          )}
          {prj.gitRepo && (
            <a href={prj.gitRepo} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline text-sm dark:text-gray-400" title="GitHub 仓库">🐙</a>
          )}
        </td>
        <td className="py-2 px-3">
          <button onClick={() => onAddProposal(prj)} className="text-green-600 hover:underline text-sm mr-3 dark:text-green-400">+ 提案</button>
          <button onClick={() => onEditProject(prj)} className="text-blue-600 hover:underline text-sm mr-3 dark:text-blue-400">编辑</button>
          <button onClick={() => onDeleteProject(prj.id)} className="text-red-600 hover:underline text-sm dark:text-red-400">删除</button>
        </td>
      </tr>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{prj.id}</span>
        <div className="flex items-center gap-2">
          {prj.domain && <span className="text-xs bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">{prj.domain}</span>}
          <span className="text-sm text-gray-500 dark:text-gray-400">{prj.proposals?.length || 0} 个提案</span>
        </div>
      </div>
      <h3 className="font-semibold text-lg mb-1 truncate cursor-pointer text-blue-600 hover:underline dark:text-blue-400"
          onClick={() => onSelectProject(prj.id)}>
        {prj.name}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{prj.description || '无描述'}</p>

      <div className="flex gap-2 mb-3">
        {prj.url && (
          <button onClick={() => onCopy(prj.url)} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 text-gray-600 dark:text-gray-300">
            🔗 访问
          </button>
        )}
        {prj.gitRepo && (
          <button onClick={() => onCopy(prj.gitRepo)} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 text-gray-600 dark:text-gray-300" title={prj.gitRepo}>
            🐙 仓库
          </button>
        )}
      </div>

      {/* Latest proposal preview */}
      {latestProposal && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">最新提案</p>
            {prj.proposals.length > 1 && (
              <button onClick={() => onSelectProject(prj.id)} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                查看全部 {prj.proposals.length} 个 →
              </button>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{latestProposal.id}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                latestProposal.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                latestProposal.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                latestProposal.status === 'accepted' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' :
                latestProposal.status === 'in_acceptance' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
                latestProposal.status === 'approved_for_dev' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
              }`}>
                {STATUS_LABELS[latestProposal.status] || latestProposal.status}
              </span>
            </div>
            <p className="font-medium mt-1 truncate text-gray-800 dark:text-gray-200">{latestProposal.name}</p>
            <div className="flex gap-2 mt-1">
              {latestProposal.url && (
                <a href={latestProposal.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs dark:text-blue-400">访问</a>
              )}
              {latestProposal.packageUrl && (
                <a href={latestProposal.packageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs dark:text-blue-400">下载</a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={() => onAddProposal(prj)} className="flex-1 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 rounded px-3 py-1.5 text-sm hover:bg-green-50 dark:hover:bg-green-900/30">
          + 提案
        </button>
        <button onClick={() => onEditProject(prj)} className="flex-1 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30">
          编辑
        </button>
        <button onClick={() => onDeleteProject(prj.id)} className="flex-1 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/30">
          删除
        </button>
      </div>
    </div>
  )
}
