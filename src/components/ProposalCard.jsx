const TYPE_LABELS = { web: '🌐', app: '📱', package: '📦' }
const STATUS_LABELS = { active: '✅ Active', in_dev: '🔧 开发中', archived: '📁 已归档' }

export default function ProposalCard({ proposal: p, viewMode, onEdit, onDelete, onCopy }) {
  if (viewMode === 'table') {
    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="py-2 px-3 font-mono text-sm">{p.id}</td>
        <td className="py-2 px-3 font-medium">{p.name}</td>
        <td className="py-2 px-3 text-sm text-gray-600 max-w-xs truncate">{p.description}</td>
        <td className="py-2 px-3">{TYPE_LABELS[p.type] || p.type}</td>
        <td className="py-2 px-3 text-sm">{STATUS_LABELS[p.status] || p.status}</td>
        <td className="py-2 px-3">
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mr-2">
              访问
            </a>
          )}
          {p.packageUrl && (
            <a href={p.packageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              下载
            </a>
          )}
        </td>
        <td className="py-2 px-3">
          <button onClick={() => onEdit(p)} className="text-blue-600 hover:underline text-sm mr-3">编辑</button>
          <button onClick={() => onDelete(p.id)} className="text-red-600 hover:underline text-sm">删除</button>
        </td>
      </tr>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-xs text-gray-500">{p.id}</span>
        <span className="text-lg">{TYPE_LABELS[p.type] || '📦'}</span>
      </div>
      <h3 className="font-semibold text-lg mb-1 truncate">{p.name}</h3>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{p.description || '无描述'}</p>

      <div className="text-xs text-gray-500 mb-3">
        <span className={`px-2 py-0.5 rounded ${p.status === 'active' ? 'bg-green-100 text-green-700' : p.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[p.status] || p.status}
        </span>
        {p.tags?.map(tag => (
          <span key={tag} className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded ml-1">{tag}</span>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        {p.url && (
          <button onClick={() => onCopy(p.url)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1">
            🔗 复制访问链接
          </button>
        )}
        {p.packageUrl && (
          <button onClick={() => onCopy(p.packageUrl)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1">
            📥 复制下载链接
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => onEdit(p)} className="flex-1 text-blue-600 border border-blue-600 rounded px-3 py-1.5 text-sm hover:bg-blue-50">
          编辑
        </button>
        <button onClick={() => onDelete(p.id)} className="flex-1 text-red-600 border border-red-600 rounded px-3 py-1.5 text-sm hover:bg-red-50">
          删除
        </button>
      </div>
    </div>
  )
}
