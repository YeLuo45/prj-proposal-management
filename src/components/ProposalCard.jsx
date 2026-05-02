function ProposalCard({ proposal, onEdit, onDelete, onCopyUrl }) {
  const typeColors = {
    web: 'bg-blue-100 text-blue-800',
    app: 'bg-green-100 text-green-800',
    package: 'bg-purple-100 text-purple-800',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    in_dev: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs text-gray-500">{proposal.id}</span>
          <h3 className="text-lg font-semibold text-gray-800">{proposal.name}</h3>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${typeColors[proposal.type]}`}>
            {proposal.type}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${statusColors[proposal.status]}`}>
            {proposal.status}
          </span>
        </div>
      </div>

      <p className="text-gray-600 mb-4">{proposal.description}</p>

      {proposal.tags && proposal.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {proposal.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 mb-4">
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
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 text-sm"
        >
          编辑
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 text-sm"
        >
          删除
        </button>
      </div>
    </div>
  );
}

export default ProposalCard;
