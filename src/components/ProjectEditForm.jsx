import { useState } from 'react';

function ProjectEditForm({ project, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    url: project.url || '',
    gitRepo: project.gitRepo || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...project,
      name: formData.name,
      description: formData.description,
      url: formData.url,
      gitRepo: formData.gitRepo,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          项目ID
        </label>
        <input
          type="text"
          value={project.id}
          disabled
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          项目名称 <span className="text-xs text-gray-400">(初始化后不可修改)</span>
        </label>
        <input
          type="text"
          value={formData.name}
          disabled
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          描述
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          rows={3}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          访问地址
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          placeholder="https://..."
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Git仓库
        </label>
        <input
          type="url"
          value={formData.gitRepo}
          onChange={(e) => setFormData({ ...formData, gitRepo: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          placeholder="https://github.com/..."
        />
      </div>
      <div className="flex gap-2 justify-end">
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
    </form>
  );
}

export default ProjectEditForm;
