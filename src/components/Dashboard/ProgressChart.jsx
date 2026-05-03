import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function ProgressChart({ data, darkMode }) {
  if (!data.labels || data.labels.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          项目进度
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          暂无数据
        </div>
      </div>
    );
  }

  // Aggregate all proposals across projects
  let totalActive = data.active.reduce((a, b) => a + b, 0);
  let totalInDev = data.inDev.reduce((a, b) => a + b, 0);
  let totalArchived = data.archived.reduce((a, b) => a + b, 0);
  let total = totalActive + totalInDev + totalArchived;

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          项目进度
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          暂无提案数据
        </div>
      </div>
    );
  }

  const chartData = {
    labels: ['进行中 (Active)', '开发中 (In Dev)', '已完成/归档'],
    datasets: [
      {
        data: [totalActive, totalInDev, totalArchived],
        backgroundColor: [
          '#10b981', // green for active
          '#f59e0b', // yellow/amber for in_dev
          '#6b7280', // gray for completed/archived
        ],
        borderColor: [
          darkMode ? '#059669' : '#059669',
          darkMode ? '#d97706' : '#d97706',
          darkMode ? '#4b5563' : '#4b5563',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#d1d5db' : '#374151',
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        项目进度概览
      </h3>
      <div className="h-64">
        <Doughnut options={options} data={chartData} />
      </div>
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        共 {total} 个提案
      </div>
    </div>
  );
}

export default ProgressChart;
