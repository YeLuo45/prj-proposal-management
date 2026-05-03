function MetricCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        {icon && (
          <span className="text-2xl">{icon}</span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
