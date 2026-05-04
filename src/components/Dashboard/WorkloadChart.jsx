import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function WorkloadChart({ data, darkMode }) {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          工作量分布 (Workload Distribution)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          暂无项目数据
        </div>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#d1d5db' : '#374151',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          stepSize: 1,
        },
        title: {
          display: true,
          text: '提案数量',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: '待办',
        data: data.active,
        backgroundColor: '#3b82f6',
      },
      {
        label: '进行中',
        data: data.inDev,
        backgroundColor: '#f59e0b',
      },
      {
        label: '已完成',
        data: data.completed,
        backgroundColor: '#10b981',
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        工作量分布 (Workload Distribution)
      </h3>
      <div className="h-64">
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
}

export default WorkloadChart;
