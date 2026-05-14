import { useEffect, useMemo, useState } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend
);

function DashboardView() {
  const { themeId } = useTheme();
  const isDark = themeId === 'dark' || themeId === 'forest' || themeId === 'sunset';
  const [allProposals, setAllProposals] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from local proposals.json
  // Detects tree format (v2: projects=[{id, name, proposals:[...]}])
  // vs flat format (v3: projects=[proposal, proposal, ...])
  useEffect(() => {
    fetch('/data/proposals.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load proposals data');
        return res.json();
      })
      .then(data => {
        if (data.projects && Array.isArray(data.projects)) {
          const first = data.projects[0];
          if (first && 'proposals' in first) {
            // Tree format: each entry is a project with nested proposals
            setProjectList(data.projects);
            const flat = data.projects.flatMap(project =>
              (project.proposals || []).map(p => ({ ...p, _projectName: project.name, _projectId: project.id }))
            );
            setAllProposals(flat);
          } else {
            // Flat format: data.projects is a flat array of proposals (each has projectId)
            setProjectList([]);
            setAllProposals(data.projects);
          }
        } else if (data.proposals && Array.isArray(data.proposals)) {
          setProjectList([]);
          setAllProposals(data.proposals);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Projects for chart distribution: use projectList (tree) or group flat proposals
  const projects = useMemo(() => {
    if (projectList.length > 0) {
      // Tree format: expose project-level data
      return projectList.map(p => ({
        id: p.id,
        name: p.name,
        proposals: p.proposals || [],
        description: p.description || '',
        url: p.url || '',
        gitRepo: p.gitRepo || '',
        deploymentUrl: p.deploymentUrl || '',
      }));
    }
    // Flat format: group by projectId
    const realProjectIds = new Set(
      allProposals.map(p => p.projectId).filter(pid => pid && pid.startsWith('PRJ-'))
    );
    const groups = {};
    allProposals.forEach(p => {
      const pid = p.projectId;
      const key = (!pid || !realProjectIds.has(pid)) ? '__ORPHAN__' : pid;
      if (!groups[key]) {
        groups[key] = { id: key, name: pid && realProjectIds.has(pid) ? pid : '未分类', proposals: [], description: '', url: '', gitRepo: '', deploymentUrl: '' };
      }
      groups[key].proposals.push(p);
      if (!groups[key].gitRepo && p.gitRepo) groups[key].gitRepo = p.gitRepo;
      if (!groups[key].deploymentUrl && p.deploymentUrl) groups[key].deploymentUrl = p.deploymentUrl;
      if (!groups[key].url && p.url) groups[key].url = p.url;
      if (!groups[key].description && p.description) groups[key].description = p.description;
    });
    return Object.values(groups);
  }, [allProposals, projectList]);

  // Dark mode effect for Chart.js
  useEffect(() => {
    ChartJS.defaults.color = isDark ? '#9ca3af' : '#374151';
    ChartJS.defaults.borderColor = isDark ? '#374151' : '#e5e7eb';
  }, [isDark]);

  // Compute statistics
  const stats = useMemo(() => {
    const totalCount = allProposals.length;
    const now = new Date();
    const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const thisMonthCount = allProposals.filter(p => {
      const created = p.createdAt || '';
      return created.startsWith(thisMonth);
    }).length;
    const activeCount = allProposals.filter(p => p.status === 'active').length;
    const inDevCount = allProposals.filter(p => p.status === 'in_dev').length;
    return { totalCount, thisMonthCount, activeCount, inDevCount };
  }, [allProposals]);

  // Status distribution (horizontal bar chart data)
  const statusData = useMemo(() => {
    const active = allProposals.filter(p => p.status === 'active').length;
    const inDev = allProposals.filter(p => p.status === 'in_dev').length;
    const archived = allProposals.filter(p => p.status === 'archived').length;
    const delivered = allProposals.filter(p => p.status === 'delivered').length;
    return {
      labels: ['Active', 'In Dev', 'Archived', 'Delivered'],
      datasets: [{
        label: '提案数量',
        data: [active, inDev, archived, delivered],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(107, 114, 128, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderWidth: 0,
      }]
    };
  }, [allProposals]);

  // Project distribution (doughnut chart - top 10 projects by proposal count)
  const projectDistributionData = useMemo(() => {
    const projectCounts = {};
    projects.forEach(p => {
      const name = p.name;
      projectCounts[name] = (projectCounts[name] || 0) + p.proposals.length;
    });
    const sorted = Object.entries(projectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(234, 179, 8, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(251, 146, 60, 0.8)',
      'rgba(99, 102, 241, 0.8)',
      'rgba(163, 163, 163, 0.8)',
    ];

    return {
      labels: sorted.map(([name]) => name),
      datasets: [{
        data: sorted.map(([, count]) => count),
        backgroundColor: colors.slice(0, sorted.length),
        borderWidth: 0,
      }]
    };
  }, [projects]);

  // Monthly trend (line chart - last 6 months)
  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    const months = [];
    const counts = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      months.push(d.toLocaleDateString('zh-CN', { month: 'short' }));

      const count = allProposals.filter(p => {
        const created = p.createdAt || '';
        return created.startsWith(monthKey);
      }).length;
      counts.push(count);
    }

    return {
      labels: months,
      datasets: [{
        label: '新增提案',
        data: counts,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
      }]
    };
  }, [allProposals]);

  // Recent active proposals (last 10 by updatedAt)
  const recentProposals = useMemo(() => {
    return [...allProposals]
      .filter(p => p.updatedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);
  }, [allProposals]);

  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 } },
      y: { ticks: { color: isDark ? '#9ca3af' : '#374151' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: { legend: { position: 'bottom', labels: { padding: 15 } } }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      in_dev: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      delivered: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
    return `px-2 py-1 rounded text-xs ${styles[status] || styles.active}`;
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors pb-16 md:pb-0">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">个人数据仪表盘</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">总提案数</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalCount}</p>
              </div>
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeCount}</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">In Dev</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.inDevCount}</p>
              </div>
              <span className="text-2xl">🔄</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">本月新增</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.thisMonthCount}</p>
              </div>
              <span className="text-2xl">🆕</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Charts Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Distribution Bar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">状态分布</h3>
              <div className="h-48">
                <Bar data={statusData} options={barOptions} />
              </div>
            </div>

            {/* Monthly Trend Line Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">月度趋势（近6个月）</h3>
              <div className="h-48">
                <Line data={monthlyTrendData} options={lineOptions} />
              </div>
            </div>
          </div>

          {/* Right Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Project Distribution Doughnut */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">项目分布（Top 10）</h3>
              <div className="h-64">
                <Doughnut data={projectDistributionData} options={doughnutOptions} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">快捷入口</h3>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/?action=new'}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新建提案
                </button>
                <button
                  onClick={() => window.location.href = '/?action=import'}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  导入CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Active Proposals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">最近活跃提案</h3>
          {recentProposals.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">暂无提案</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">标题</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">项目</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">状态</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">更新时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentProposals.map((proposal) => (
                    <tr
                      key={proposal.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => window.location.href = `/?project=${proposal._projectId || proposal.projectId}&proposal=${proposal.id}`}
                    >
                      <td className="px-4 py-2 text-sm text-blue-500">{proposal.id}</td>
                      <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 truncate max-w-xs">{proposal.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{proposal._projectName || '未分类'}</td>
                      <td className="px-4 py-2">
                        <span className={getStatusBadge(proposal.status)}>{proposal.status}</span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{proposal.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
