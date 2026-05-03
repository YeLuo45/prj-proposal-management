function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          最近活动
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          暂无活动记录
        </div>
      </div>
    );
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? '刚刚' : `${diffMins}分钟前`;
      }
      return `${diffHours}小时前`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return dateStr;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'in_dev':
        return 'bg-yellow-500';
      case 'accepted':
      case 'delivered':
        return 'bg-blue-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        最近活动
      </h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status)}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {formatTime(activity.updatedAt)}
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {activity.id}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {activity.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {activity.projectName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityTimeline;
