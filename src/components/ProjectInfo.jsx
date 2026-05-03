import { useState } from 'react';

function ProjectInfo({ project, onEdit }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    url: project.url || '',
    gitRepo: project.gitRepo || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onEdit({
      ...project,
      name: formData.name,
      description: formData.description,
      url: formData.url,
      gitRepo: formData.gitRepo,
    });
    setShowForm(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{project.id}</span>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {project.name}
          </h2>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: project.name,
              description: project.description || '',
              url: project.url || '',
              gitRepo: project.gitRepo || '',
            });
            setShowForm(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          编辑项目
        </button>
      </div>

      {project.description && (
        <p className="text-gray-600 dark:text-gray-300 mb-4">{project.description}</p>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span>创建: {project.createdAt}</span>
        <span>|</span>
        <span>更新: {project.updatedAt}</span>
        {project.url && (
          <>
            <span>|</span>
            <button
              onClick={() => window.open(project.url, '_blank')}
              className="text-blue-500 hover:text-blue-600"
            >
              访问
            </button>
          </>
        )}
        {project.gitRepo && (
          <>
            <span>|</span>
            <button
              onClick={() => window.open(project.gitRepo, '_blank')}
              className="text-blue-500 hover:text-blue-600"
            >
              仓库
            </button>
          </>
        )}
      </div>

      {/* Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              编辑项目
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  项目名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  required
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
                  onClick={() => setShowForm(false)}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectInfo;
