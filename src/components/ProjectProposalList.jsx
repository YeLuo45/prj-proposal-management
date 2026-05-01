const TYPE_LABELS = { web: '🌐', app: '📱', package: '📦' }
const STATUS_LABELS = { active: '✅ Active', in_dev: '🔧 开发中', archived: '📁 已归档' }

export default function ProjectProposalList({ project, onBack, onAddProposal, onEditProposal, onDeleteProposal, onCopy }) {
  if (!project) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>项目不存在</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">← 返回项目列表</button>
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
          <button onClick={onBack} className="text-blue-600 hover:underline text-sm mb-2">← 返回项目列表</button>
          <h2 className="text-xl font-bold">{project.name}</h2>
          <p className="text-gray-600 text-sm mt-1">{project.description || '无描述'}</p>
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
        <div className="bg-white rounded shadow p-8 text-center text-gray-500">
          暂无提案
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProposals.map(p => (
            <div key={p.id} className="bg-white rounded shadow hover:shadow-md transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-500">{p.id}</span>
                  <span className="text-lg font-semibold">{p.name}</span>
                  {p.type && (
                    <span className="text-xl">{TYPE_LABELS[p.type] || '📦'}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                      🔗 访问
                    </a>
                  )}
                  {p.packageUrl && (
                    <a href={p.packageUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                      📥 下载
                    </a>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3">{p.description || '无描述'}</p>

              {p.tags && p.tags.length > 0 && (
                <div className="flex gap-1 mb-3 flex-wrap">
                  {p.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-3 border-t pt-3">
                <button onClick={() => onEditProposal(project.id, p)} className="text-blue-600 hover:underline text-sm">编辑</button>
                <button onClick={() => onDeleteProposal(project.id, p.id)} className="text-red-600 hover:underline text-sm">删除</button>
                <span className="text-xs text-gray-400 ml-auto">
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
