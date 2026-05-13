import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock chart.js to avoid canvas issues
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => <div data-testid="line-chart" data-labels={JSON.stringify(data.labels)} data-values={JSON.stringify(data.datasets[0].data)}>LineChart</div>,
  Doughnut: ({ data, options }) => <div data-testid="doughnut-chart" data-labels={JSON.stringify(data.labels)} data-values={JSON.stringify(data.datasets[0].data)}>DoughnutChart</div>,
  Bar: ({ data, options }) => <div data-testid="bar-chart" data-labels={JSON.stringify(data.labels)} data-values={JSON.stringify(data.datasets[0].data)}>BarChart</div>,
}));

// Mock ThemeContext
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ themeId: 'light' }),
}));

// Import after mocks
import DashboardView, { groupProposalsByProject } from './DashboardView';

const sampleProposals = [
  { id: 'P-20260501-001', name: 'ai-stock-simulation', projectId: 'PRJ-001', status: 'active', createdAt: '2026-05-01', updatedAt: '2026-05-01' },
  { id: 'P-20260501-002', name: 'ai-stock-simulation', projectId: 'PRJ-001', status: 'in_dev', createdAt: '2026-05-01', updatedAt: '2026-05-02' },
  { id: 'P-20260502-001', name: 'prj-proposals-manager', projectId: 'PRJ-002', status: 'active', createdAt: '2026-05-02', updatedAt: '2026-05-03' },
  { id: 'P-20260401-001', name: 'pixel-pal-web', projectId: 'PRJ-003', status: 'archived', createdAt: '2026-04-01', updatedAt: '2026-04-15' },
  { id: 'P-20260513-001', name: 'dashboard-test', projectId: 'PRJ-004', status: 'active', createdAt: '2026-05-13', updatedAt: '2026-05-13' },
];

describe('groupProposalsByProject', () => {
  it('should group proposals by projectId', () => {
    const result = groupProposalsByProject(sampleProposals);
    expect(result).toHaveLength(4);
    const project1 = result.find(g => g.id === 'PRJ-001');
    expect(project1.proposals).toHaveLength(2);
  });

  it('should use projectId as key, falling back to name', () => {
    const single = [{ id: 'P-1', name: 'my-project', projectId: '', status: 'active' }];
    const result = groupProposalsByProject(single);
    expect(result[0].id).toBe('');
    expect(result[0].name).toBe('my-project');
  });

  it('should handle empty array', () => {
    const result = groupProposalsByProject([]);
    expect(result).toHaveLength(0);
  });
});

describe('DashboardView rendering', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should show loading state initially', async () => {
    let resolve;
    mockFetch.mockImplementation(() => new Promise(r => resolve = r));
    
    render(<DashboardView />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
    
    // Clean up
    resolve({ ok: true, json: () => Promise.resolve({ projects: [] }) });
  });

  it('should show error state on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should render 4 stat cards with correct data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: 2, projects: sampleProposals }),
    });
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByText('总提案数')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // total
      expect(screen.getByText('✅')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('In Dev')).toBeInTheDocument();
    expect(screen.getByText('本月新增')).toBeInTheDocument();
  });

  it('should render status distribution bar chart', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: 2, projects: sampleProposals }),
    });
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
    
    const barChart = screen.getByTestId('bar-chart');
    const labels = JSON.parse(barChart.dataset.labels);
    expect(labels).toContain('Active');
    expect(labels).toContain('In Dev');
  });

  it('should render project distribution doughnut chart', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: 2, projects: sampleProposals }),
    });
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
    });
  });

  it('should render monthly trend line chart', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: 2, projects: sampleProposals }),
    });
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('should render recent proposals table', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: 2, projects: sampleProposals }),
    });
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByText('最近活跃提案')).toBeInTheDocument();
    });
    
    // Should show proposals sorted by updatedAt desc
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('should render quick action buttons', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: 2, projects: sampleProposals }),
    });
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByText('新建提案')).toBeInTheDocument();
      expect(screen.getByText('导入CSV')).toBeInTheDocument();
    });
  });

  it('should show empty state when no proposals', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ version: 2, projects: [] }),
    });
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByText('总提案数')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  it('should handle proposals in flat array format', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ proposals: sampleProposals }),
    });
    
    render(<DashboardView />);
    
    await waitFor(() => {
      expect(screen.getByText('总提案数')).toBeInTheDocument();
    });
  });
});
