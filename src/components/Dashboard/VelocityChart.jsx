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

function VelocityChart({ data, darkMode }) {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          速度图 (Velocity Chart)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          暂无完成数据
        </div>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: darkMode ? '#374151' : '#e5e7eb',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          stepSize: 1,
        },
        title: {
          display: true,
          text: '完成提案数',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: '完成数',
        data: data.completed,
        backgroundColor: '#10b981',
        borderColor: darkMode ? '#059669' : '#059669',
        borderWidth: 1,
      },
      {
        label: '计划数',
        data: data.planned,
        backgroundColor: '#3b82f6',
        borderColor: darkMode ? '#2563eb' : '#2563eb',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        速度图 (Velocity Chart)
      </h3>
      <div className="h-64">
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
}

export default VelocityChart;
