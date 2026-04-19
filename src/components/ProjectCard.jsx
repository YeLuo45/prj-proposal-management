const TYPE_LABELS = { web: '🌐', app: '📱', package: '📦' }
const STATUS_LABELS = { active: '✅ Active', in_dev: '🔧 开发中', archived: '📁 已归档' }

export default function ProjectCard({ project: prj, viewMode, onSelectProject, onEditProject, onDeleteProject, onAddProposal, onEditProposal, onDeleteProposal, onCopy }) {
  // Latest proposal (most recent by updatedAt)
  const latestProposal = prj.proposals?.length
    ? [...prj.proposals].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))[0]
    : null

  if (viewMode === 'table') {
    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="py-2 px-3 font-mono text-sm">{prj.id}</td>
        <td className="py-2 px-3 font-medium">
          <button onClick={() => onSelectProject(prj.id)} className="text-blue-600 hover:underline text-left">
            {prj.name}
          </button>
        </td>
        <td className="py-2 px-3 text-sm text-gray-600 max-w-xs truncate">{prj.description}</td>
        <td className="py-2 px-3 text-sm">
          {latestProposal
            ? <button onClick={() => onSelectProject(prj.id)} className="text-left hover:underline">
                <span className="font-mono text-xs text-gray-400 mr-1">{latestProposal.id}</span>
                <span className="text-gray-600">{prj.proposals?.length || 0} 个提案</span>
              </button>
            : <span>{prj.proposals?.length || 0} 个提案</span>}
        </td>
        <td className="py-2 px-3">
          {prj.url && (
            <a href={prj.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mr-2">访问</a>
          )}
          {prj.gitRepo && (
            <a href={prj.gitRepo} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline text-sm" title="GitHub 仓库">🐙</a>
          )}
        </td>
        <td className="py-2 px-3">
          <button onClick={() => onAddProposal(prj)} className="text-green-600 hover:underline text-sm mr-3">+ 提案</button>
          <button onClick={() => onEditProject(prj)} className="text-blue-600 hover:underline text-sm mr-3">编辑</button>
          <button onClick={() => onDeleteProject(prj.id)} className="text-red-600 hover:underline text-sm">删除</button>
        </td>
      </tr>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-xs text-gray-500">{prj.id}</span>
        <div className="flex items-center gap-2">
          {prj.domain && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{prj.domain}</span>}
          <span className="text-sm text-gray-500">{prj.proposals?.length || 0} 个提案</span>
        </div>
      </div>
      <h3 className="font-semibold text-lg mb-1 truncate cursor-pointer text-blue-600 hover:underline"
          onClick={() => onSelectProject(prj.id)}>
        {prj.name}
      </h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{prj.description || '无描述'}</p>

      <div className="flex gap-2 mb-3">
        {prj.url && (
          <button onClick={() => onCopy(prj.url)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1">
            🔗 访问
          </button>
        )}
        {prj.gitRepo && (
          <button onClick={() => onCopy(prj.gitRepo)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1" title={prj.gitRepo}>
            🐙 仓库
          </button>
        )}
      </div>

      {/* Latest proposal preview */}
      {latestProposal && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500">最新提案</p>
            {prj.proposals.length > 1 && (
              <button onClick={() => onSelectProject(prj.id)} className="text-xs text-blue-600 hover:underline">
                查看全部 {prj.proposals.length} 个 →
              </button>
            )}
          </div>
          <div className="bg-gray-50 rounded p-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-400">{latestProposal.id}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${latestProposal.status === 'active' ? 'bg-green-100 text-green-700' : latestProposal.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[latestProposal.status] || latestProposal.status}
              </span>
            </div>
            <p className="font-medium mt-1 truncate">{latestProposal.name}</p>
            <div className="flex gap-2 mt-1">
              {latestProposal.url && (
                <a href={latestProposal.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">访问</a>
              )}
              {latestProposal.packageUrl && (
                <a href={latestProposal.packageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">下载</a>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button onClick={() => onAddProposal(prj)} className="flex-1 text-green-600 border border-green-600 rounded px-3 py-1.5 text-sm hover:bg-green-50">
          + 提案
        </button>
        <button onClick={() => onEditProject(prj)} className="flex-1 text-blue-600 border border-blue-600 rounded px-3 py-1.5 text-sm hover:bg-blue-50">
          编辑
        </button>
        <button onClick={() => onDeleteProject(prj.id)} className="flex-1 text-red-600 border border-red-600 rounded px-3 py-1.5 text-sm hover:bg-red-50">
          删除
        </button>
      </div>
    </div>
  )
}
