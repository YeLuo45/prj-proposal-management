import { useStatsData } from '../../hooks/useStatsData';
import MetricCard from './MetricCard';
import TrendChart from './TrendChart';
import ProgressChart from './ProgressChart';
import MilestoneProgress from './MilestoneProgress';
import ActivityTimeline from './ActivityTimeline';

function Dashboard() {
  const {
    loading,
    error,
    stats,
    monthlyTrend,
    projectProgress,
    milestoneProgress,
    recentActivity,
  } = useStatsData();

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="总提案数"
            value={stats.totalCount}
            icon="📋"
          />
          <MetricCard
            title="本月新增"
            value={stats.thisMonthCount}
            subtitle="本月新增提案数"
            icon="🆕"
          />
          <MetricCard
            title="进行中"
            value={stats.inProgressCount}
            icon="🔄"
          />
          <MetricCard
            title="已完成"
            value={stats.completedCount}
            icon="✅"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart data={monthlyTrend} />
          <ProgressChart data={projectProgress} />
        </div>

        {/* Milestone Progress */}
        <MilestoneProgress data={milestoneProgress} />

        {/* Activity Timeline */}
        <ActivityTimeline activities={recentActivity} />
      </div>
    </div>
  );
}

export default Dashboard;
