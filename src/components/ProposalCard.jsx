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

export default function ProposalCard({ proposal: p, viewMode, onEdit, onDelete, onCopy }) {
  if (viewMode === 'table') {
    return (
      <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
        <td className="py-2 px-3 font-mono text-sm text-gray-700 dark:text-gray-300">{p.id}</td>
        <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-200">
          {p.url ? (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{p.name}</a>
          ) : (
            <span className="text-gray-800 dark:text-gray-200">{p.name}</span>
          )}
        </td>
        <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{p.description}</td>
        <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{TYPE_LABELS[p.type] || p.type}</td>
        <td className="py-2 px-3 text-sm">
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
        </td>
        <td className="py-2 px-3">
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mr-2 dark:text-blue-400">
              访问
            </a>
          )}
          {p.packageUrl && (
            <a href={p.packageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mr-2 dark:text-blue-400">
              下载
            </a>
          )}
          {p.gitRepo && (
            <a href={p.gitRepo} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline text-sm dark:text-gray-400" title="GitHub 仓库">
              🐙
            </a>
          )}
        </td>
        <td className="py-2 px-3">
          <button onClick={() => onEdit(p)} className="text-blue-600 hover:underline text-sm mr-3 dark:text-blue-400">编辑</button>
          <button onClick={() => onDelete(p.id)} className="text-red-600 hover:underline text-sm dark:text-red-400">删除</button>
        </td>
      </tr>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{p.id}</span>
        <span className="text-lg">{TYPE_LABELS[p.type] || '📦'}</span>
      </div>
      <h3 className="font-semibold text-lg mb-1 truncate text-gray-800 dark:text-gray-200">
        {p.url ? (
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">{p.name}</a>
        ) : (
          <span className="text-gray-800 dark:text-gray-200">{p.name}</span>
        )}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{p.description || '无描述'}</p>

      <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex flex-wrap gap-1">
        <span className={`px-2 py-0.5 rounded ${
          p.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
          p.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
          p.status === 'accepted' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300' :
          p.status === 'in_acceptance' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' :
          p.status === 'approved_for_dev' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {STATUS_LABELS[p.status] || p.status}
        </span>
        {p.tags?.map(tag => (
          <span key={tag} className="inline-block bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded ml-1">{tag}</span>
        ))}
      </div>

      <div className="flex gap-2 mb-3">
        {p.url && (
          <button onClick={() => onCopy(p.url)} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 text-gray-600 dark:text-gray-300">
            🔗 复制访问链接
          </button>
        )}
        {p.packageUrl && (
          <button onClick={() => onCopy(p.packageUrl)} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 text-gray-600 dark:text-gray-300">
            📥 复制下载链接
          </button>
        )}
        {p.gitRepo && (
          <button onClick={() => onCopy(p.gitRepo)} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1 text-gray-600 dark:text-gray-300" title={p.gitRepo}>
            🐙 复制仓库链接
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => onEdit(p)} className="flex-1 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded px-3 py-1.5 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30">
          编辑
        </button>
        <button onClick={() => onDelete(p.id)} className="flex-1 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/30">
          删除
        </button>
      </div>
    </div>
  )
}
