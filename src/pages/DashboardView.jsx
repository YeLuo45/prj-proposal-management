import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useStatsData } from '../hooks/useStatsData';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
);

function DashboardView() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [timeRange, setTimeRange] = useState('30d');

  const {
    loading,
    error,
    stats,
    projects,
    refetch,
  } = useStatsData();

  // Compute flatProposals from projects
  const flatProposals = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    return projects.flatMap(p =>
      (p.proposals || []).map(pr => ({
        ...pr,
        projectName: p.name,
        projectId: p.id,
      }))
    );
  }, [projects]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Dark mode effect for Chart.js
  useEffect(() => {
    ChartJS.defaults.color = darkMode ? '#9ca3af' : '#374151';
    ChartJS.defaults.borderColor = darkMode ? '#374151' : '#e5e7eb';
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // time-filtered proposals
  const filteredProposals = useMemo(() => {
    if (timeRange === 'all') return flatProposals;
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    else if (timeRange === '3m') cutoff.setMonth(now.getMonth() - 3);
    return flatProposals.filter(p => new Date(p.createdAt) >= cutoff);
  }, [flatProposals, timeRange]);

  // trend data (6 months line chart)
  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }
    return {
      labels: months.map(m => {
        const [y, mo] = m.split('-');
        return `${parseInt(mo)}月`;
      }),
      datasets: [{
        label: '新增提案',
        data: months.map(month => filteredProposals.filter(p => p.createdAt?.startsWith(month)).length),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      }]
    };
  }, [filteredProposals]);

  // status distribution (donut chart)
  const statusData = useMemo(() => ({
    labels: ['待办', '进行中', '已完成'],
    datasets: [{
      data: [
        filteredProposals.filter(p => p.status === 'active').length,
        filteredProposals.filter(p => p.status === 'in_dev').length,
        filteredProposals.filter(p => p.status === 'archived').length,
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(107, 114, 128, 0.8)',
      ],
      borderWidth: 0,
    }]
  }), [filteredProposals]);

  // project progress (horizontal bar chart)
  const projectProgressData = useMemo(() => {
    const progress = projects.map(p => {
      const total = p.proposals?.length || 0;
      const done = p.proposals?.filter(pr => pr.status === 'archived').length || 0;
      const inProgress = p.proposals?.filter(pr => pr.status === 'in_dev').length || 0;
      return { name: p.name, total, done, inProgress, rate: total ? Math.round(done/total*100) : 0 };
    }).sort((a, b) => b.rate - a.rate);
    return {
      labels: progress.map(p => p.name),
      datasets: [
        { label: '已完成', data: progress.map(p => p.done), backgroundColor: 'rgba(34, 197, 94, 0.8)' },
        { label: '进行中', data: progress.map(p => p.inProgress), backgroundColor: 'rgba(234, 179, 8, 0.8)' },
      ]
    };
  }, [projects]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: { legend: { position: 'bottom', labels: { padding: 20 } } }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { position: 'top' } },
    scales: { x: { stacked: true, max: 100 }, y: { stacked: true } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">数据统计</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={toggleDarkMode}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link
              to="/"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              返回列表
            </Link>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">总提案数</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalCount}</p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">进行中</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.inProgressCount}</p>
              </div>
              <span className="text-3xl">🔄</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">已完成</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.completedCount}</p>
              </div>
              <span className="text-3xl">✅</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">本月新增</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.thisMonthCount}</p>
              </div>
              <span className="text-3xl">🆕</span>
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 justify-center">
          {['7d', '30d', '3m', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {range === '7d' ? '7天' : range === '30d' ? '30天' : range === '3m' ? '3个月' : '全部'}
            </button>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">提案趋势</h3>
            <div className="h-64">
              <Line data={trendData} options={lineOptions} />
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">状态分布</h3>
            <div className="h-64">
              <Doughnut data={statusData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">项目进度</h3>
          <div className="h-64">
            <Bar data={projectProgressData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
