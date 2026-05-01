import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' }
];

export default function MilestoneForm({ milestone, proposals, onSave, onDelete, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetDate: '',
    status: 'pending',
    proposalIds: []
  });

  useEffect(() => {
    if (milestone) {
      setFormData({
        name: milestone.name || '',
        description: milestone.description || '',
        targetDate: milestone.targetDate || '',
        status: milestone.status || 'pending',
        proposalIds: milestone.proposalIds || []
      });
    }
  }, [milestone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProposalToggle = (proposalId) => {
    setFormData(prev => {
      const ids = prev.proposalIds.includes(proposalId)
        ? prev.proposalIds.filter(id => id !== proposalId)
        : [...prev.proposalIds, proposalId];
      return { ...prev, proposalIds: ids };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('请输入里程碑名称');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {milestone ? '编辑里程碑' : '新建里程碑'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                里程碑名称 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="例如：MVP 交付"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                描述
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="里程碑的详细描述..."
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Target Date */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                目标日期
              </label>
              <input
                type="date"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                状态
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Proposal IDs */}
            {proposals && proposals.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  关联提案
                </label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {proposals.map(proposal => (
                    <label
                      key={proposal.id}
                      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.proposalIds.includes(proposal.id)}
                        onChange={() => handleProposalToggle(proposal.id)}
                        className="rounded"
                      />
                      <span className="font-mono text-xs text-gray-600">{proposal.id}</span>
                      <span className="text-sm text-gray-800 truncate">{proposal.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  已选择 {formData.proposalIds.length} 个提案
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
              >
                保存
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                >
                  删除
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
