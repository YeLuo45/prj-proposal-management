function MilestoneProgress({ data, darkMode }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          里程碑完成率
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          暂无里程碑数据
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        里程碑完成率
      </h3>
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.projectId} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {item.projectName}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {item.completed}/{item.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.percentage >= 80
                    ? '#10b981' // green
                    : item.percentage >= 50
                    ? '#f59e0b' // amber
                    : '#3b82f6', // blue
                }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
              {item.percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MilestoneProgress;
