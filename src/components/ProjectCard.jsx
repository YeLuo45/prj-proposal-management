import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function ProjectCard({ project, recentProposals, hasMore, favorites, onToggleFavorite }) {
  const { t } = useTranslation();
  const isFavorite = favorites.includes(project.id);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 relative">
      {/* Star button - top right corner */}
      <button
        onClick={() => onToggleFavorite(project.id)}
        className="absolute top-3 right-3 text-xl hover:scale-110 transition-transform"
        title={isFavorite ? '从收藏移除' : '添加到收藏'}
      >
        {isFavorite ? '⭐' : '☆'}
      </button>

      <div className="flex justify-between items-start mb-3 pr-8">
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">{project.id}</span>
          <Link to={`/project/${project.id}`} className="block">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate hover:text-blue-500 dark:hover:text-blue-400">{project.name}</h3>
          </Link>
        </div>
        <span className="ml-2 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs whitespace-nowrap">
          {project.proposals?.length || 0} 提案
        </span>
      </div>

      {project.description && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="space-y-2 mb-3">
        {recentProposals.map((proposal) => (
          <div key={proposal.id} className="flex items-center gap-2 text-sm">
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              proposal.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              proposal.status === 'in_dev' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {proposal.status}
            </span>
            <span className="text-gray-700 dark:text-gray-200 truncate flex-1">{proposal.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              proposal.type === 'web' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
              proposal.type === 'app' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
              'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
            }`}>
              {proposal.type}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {(project.githubPages || project.url) && (
          <button
            onClick={() => window.open(project.githubPages || project.url, '_blank')}
            className="bg-blue-500 text-white py-1.5 rounded hover:bg-blue-600 text-sm"
          >
            访问
          </button>
        )}
        {project.gitRepo && (
          <button
            onClick={() => window.open(project.gitRepo, '_blank')}
            className="bg-gray-700 dark:bg-gray-600 text-white py-1.5 rounded hover:bg-gray-800 dark:hover:bg-gray-500 text-sm"
          >
            仓库
          </button>
        )}
        <button
          onClick={() => {
            // Navigate to project (this would typically trigger edit mode)
            window.location.href = `/project/${project.id}`;
          }}
          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
        >
          {hasMore ? `查看全部 (${project.proposals?.length || 0})` : '编辑'}
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;
