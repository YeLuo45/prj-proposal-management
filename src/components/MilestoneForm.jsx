import { useState, useEffect } from 'react';

function MilestoneForm({ milestone, proposals, projectProposals, onSave, onDelete, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetDate: '',
    status: 'pending',
    proposalIds: [],
  });

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name || '',
        description: milestone.description || '',
        targetDate: milestone.targetDate || '',
        status: milestone.status || 'pending',
        proposalIds: milestone.proposalIds || [],
      });
    }
  }, [milestone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('请输入里程碑名称');
      return;
    }
    onSave(formData);
  };

  const toggleProposal = (proposalId) => {
    setFormData(prev => ({
      ...prev,
      proposalIds: prev.proposalIds.includes(proposalId)
        ? prev.proposalIds.filter(id => id !== proposalId)
        : [...prev.proposalIds, proposalId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {milestone ? '编辑里程碑' : '添加里程碑'}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              里程碑名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="例如：需求分析"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              placeholder="里程碑详细描述..."
              rows={3}
            />
          </div>

          {/* Target Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              目标日期
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          {/* Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              状态
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="pending">待开始</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>

          {/* Proposal IDs */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              关联提案
            </label>
            {projectProposals && projectProposals.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 dark:border-gray-600">
                {projectProposals.map(proposal => (
                  <label
                    key={proposal.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.proposalIds.includes(proposal.id)}
                      onChange={() => toggleProposal(proposal.id)}
                      className="w-4 h-4 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {proposal.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {proposal.id}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm p-3 border rounded-lg">
                暂无提案
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-between">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                  删除
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MilestoneForm;
