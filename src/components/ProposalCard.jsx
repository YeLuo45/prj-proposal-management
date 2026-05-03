function ProposalCard({ proposal, onEdit, onDelete, onCopyUrl }) {
  const typeColors = {
    web: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    app: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    package: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    in_dev: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{proposal.id}</span>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{proposal.name}</h3>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${typeColors[proposal.type] || ''}`}>
            {proposal.type}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${statusColors[proposal.status] || ''}`}>
            {proposal.status}
          </span>
        </div>
      </div>

      {proposal.description && (
        <p className="text-gray-600 dark:text-gray-300 mb-4">{proposal.description}</p>
      )}

      {proposal.projectName && (
        <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-2 font-medium">
          项目: {proposal.projectName}
        </div>
      )}

      {proposal.tags && proposal.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {proposal.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        创建: {proposal.createdAt} | 更新: {proposal.updatedAt}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(proposal.id);
            alert(`项目编号 ${proposal.id} 已复制`);
          }}
          className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
        >
          复制编号
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(proposal.name);
            alert(`项目名称 ${proposal.name} 已复制`);
          }}
          className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
        >
          复制名称
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        {proposal.url && (
          <button
            onClick={() => window.open(proposal.url, '_blank')}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
          >
            访问
          </button>
        )}
        {proposal.packageUrl && (
          <button
            onClick={() => window.open(proposal.packageUrl, '_blank')}
            className="flex-1 bg-purple-500 text-white py-2 rounded hover:bg-purple-600 text-sm"
          >
            仓库
          </button>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
        >
          编辑
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-sm"
        >
          删除
        </button>
      </div>
    </div>
  );
}

export default ProposalCard;
