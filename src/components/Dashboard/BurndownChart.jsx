import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function BurndownChart({ data, darkMode }) {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          燃尽图 (Burndown Chart)
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          暂无里程碑数据
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
        },
        title: {
          display: true,
          text: '剩余工作量',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: '理想燃尽',
        data: data.ideal,
        borderColor: '#9ca3af',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        tension: 0,
        pointRadius: 0,
      },
      {
        label: '实际燃尽',
        data: data.actual,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        燃尽图 (Burndown Chart)
      </h3>
      <div className="h-64">
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
}

export default BurndownChart;
