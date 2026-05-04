import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import ProjectInfo from '../components/ProjectInfo';
import MilestoneTimeline from '../components/MilestoneTimeline';
import MilestoneForm from '../components/MilestoneForm';
import ProposalCard from '../components/ProposalCard';
import HistoryTimeline from '../components/HistoryTimeline';
import CommentsPanel from '../components/CommentsPanel';
import { useGitHub } from '../hooks/useGitHub';
import { recordCreate, recordUpdate, recordDelete, getProjectHistory } from '../services/historyService';
import { getEntityComments, addComment, deleteComment } from '../services/commentService';

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, fetchProposals, saveProposals } = useGitHub();

  const [project, setProject] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // V20: Tab state
  const [activeTab, setActiveTab] = useState('details');
  const [projectHistory, setProjectHistory] = useState([]);
  const [projectComments, setProjectComments] = useState([]);

  // Tab configuration
  const tabs = [
    { id: 'details', label: '详情', icon: '📋' },
    { id: 'timeline', label: '历史', icon: '📊' },
    { id: 'comments', label: '评论', icon: '💬' },
  ];

  // Load data on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (!savedToken) {
      navigate('/');
      return;
    }
    loadData();
  }, [id]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Load history and comments when tab changes
  useEffect(() => {
    if (activeTab === 'timeline') {
      setProjectHistory(getProjectHistory(id));
    }
    if (activeTab === 'comments') {
      setProjectComments(getEntityComments('project', id));
    }
  }, [activeTab, id]);

  const loadData = async () => {
    try {
      const data = await fetchProposals();
      // Support v2 format {projects: [...]} and v3 format {version: 3, projects: [...]}
      let projects = [];
      let flatProposals = [];

      if (data.projects && Array.isArray(data.projects)) {
        projects = data.projects;
        // Flatten proposals with project context
        flatProposals = projects.flatMap(p =>
          (p.proposals || []).map(prop => ({
            ...prop,
            projectName: p.name,
            projectId: p.id,
          }))
        );
      } else if (data.proposals && Array.isArray(data.proposals)) {
        flatProposals = data.proposals;
      }

      // Migrate to v3 if needed
      let needsMigration = false;
      projects = projects.map(p => {
        if (!p.milestones) {
          needsMigration = true;
          return { ...p, milestones: [] };
        }
        return p;
      });

      if (needsMigration) {
        await saveProposals({ ...data, version: 3, projects });
      }

      setAllProjects(projects);
      setProposals(flatProposals);

      const foundProject = projects.find(p => p.id === id);
      if (foundProject) {
        setProject(foundProject);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to load project:', err);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Handle project edit
  const handleEditProject = async (updatedProject) => {
    try {
      const oldProject = project;
      const newProjects = allProjects.map(p =>
        p.id === updatedProject.id
          ? { ...updatedProject, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      );
      await saveProposals({ version: 3, projects: newProjects });
      
      // Record history
      recordUpdate('project', updatedProject.id, oldProject, updatedProject, updatedProject.id);
      
      setAllProjects(newProjects);
      setProject(newProjects.find(p => p.id === updatedProject.id));
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  };

  // Handle milestone CRUD
  const handleAddMilestone = async (milestoneData) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existingMilestones = project.milestones || [];
      const seqNum = String(existingMilestones.length + 1).padStart(3, '0');
      const msId = `MS-${today.replace(/-/g, '')}-${seqNum}`;

      const newMilestone = {
        id: msId,
        name: milestoneData.name,
        description: milestoneData.description || '',
        targetDate: milestoneData.targetDate || '',
        status: milestoneData.status || 'pending',
        proposalIds: milestoneData.proposalIds || [],
        createdAt: today,
        updatedAt: today,
      };

      const newMilestones = [...existingMilestones, newMilestone];
      const updatedProject = { ...project, milestones: newMilestones };
      
      const newProjects = allProjects.map(p =>
        p.id === project.id ? updatedProject : p
      );
      
      await saveProposals({ version: 3, projects: newProjects });
      
      // Record history
      recordCreate('milestone', newMilestone, project.id);
      
      setProject(updatedProject);
      setAllProjects(newProjects);
      setShowMilestoneForm(false);
    } catch (err) {
      console.error('Failed to add milestone:', err);
    }
  };

  const handleUpdateMilestone = async (milestoneId, updates) => {
    try {
      const oldMilestone = project.milestones?.find(m => m.id === milestoneId);
      const newMilestones = (project.milestones || []).map(m =>
        m.id === milestoneId
          ? { ...m, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : m
      );
      const updatedProject = { ...project, milestones: newMilestones };
      const newProjects = allProjects.map(p =>
        p.id === project.id ? updatedProject : p
      );
      
      await saveProposals({ version: 3, projects: newProjects });
      
      // Record history
      const updatedMilestone = newMilestones.find(m => m.id === milestoneId);
      if (oldMilestone) {
        recordUpdate('milestone', milestoneId, oldMilestone, updatedMilestone, project.id);
      }
      
      setProject(updatedProject);
      setAllProjects(newProjects);
      setEditingMilestone(null);
      setShowMilestoneForm(false);
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!confirm('确定要删除这个里程碑吗？')) return;
    try {
      const milestoneToDelete = project.milestones?.find(m => m.id === milestoneId);
      const newMilestones = (project.milestones || []).filter(m => m.id !== milestoneId);
      const updatedProject = { ...project, milestones: newMilestones };
      const newProjects = allProjects.map(p =>
        p.id === project.id ? updatedProject : p
      );
      
      await saveProposals({ version: 3, projects: newProjects });
      
      // Record history
      if (milestoneToDelete) {
        recordDelete('milestone', milestoneToDelete, project.id);
      }
      
      setProject(updatedProject);
      setAllProjects(newProjects);
      setEditingMilestone(null);
      setShowMilestoneForm(false);
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  };

  const handleMilestoneClick = (milestone) => {
    setEditingMilestone(milestone);
    setShowMilestoneForm(true);
  };

  // Handle comments
  const handleAddComment = (content) => {
    const newComment = addComment('project', project?.id, content, 'User');
    setProjectComments(getEntityComments('project', project?.id));
    return newComment;
  };

  const handleDeleteComment = (commentId) => {
    deleteComment('project', project?.id, commentId);
    setProjectComments(getEntityComments('project', project?.id));
  };

  // Get proposals associated with this project's milestones
  const associatedProposals = [];
  if (project?.milestones) {
    const milestoneProposalIds = new Set();
    project.milestones.forEach(ms => {
      (ms.proposalIds || []).forEach(pid => milestoneProposalIds.add(pid));
    });
    milestoneProposalIds.forEach(pid => {
      const prop = proposals.find(p => p.id === pid);
      if (prop) associatedProposals.push(prop);
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">项目不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Header
        onSettings={() => {}}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        projectName={project.name}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4"
        >
          <span>←</span> 返回列表
        </Link>

        {/* V20: Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Project Info */}
                <ProjectInfo
                  project={project}
                  onEdit={handleEditProject}
                />

                {/* Milestone Timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      里程碑进度
                    </h2>
                    <button
                      onClick={() => {
                        setEditingMilestone(null);
                        setShowMilestoneForm(true);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <span>+</span> 添加里程碑
                    </button>
                  </div>
                  <MilestoneTimeline
                    milestones={project.milestones || []}
                    onMilestoneClick={handleMilestoneClick}
                  />
                </div>

                {/* Associated Proposals */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    关联提案 ({associatedProposals.length}个)
                  </h2>
                  {associatedProposals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {associatedProposals.map(proposal => (
                        <ProposalCard
                          key={proposal.id}
                          proposal={proposal}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          onCopyUrl={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                      暂无关联提案
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    历史记录
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {projectHistory.length} 条记录
                  </span>
                </div>
                <HistoryTimeline
                  history={projectHistory}
                  onRecordClick={(record) => console.log('Record clicked:', record)}
                />
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    项目评论
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {projectComments.length} 条评论
                  </span>
                </div>
                <CommentsPanel
                  entityType="project"
                  entityId={project.id}
                  comments={projectComments}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Milestone Form Modal */}
      {showMilestoneForm && (
        <MilestoneForm
          milestone={editingMilestone}
          proposals={proposals}
          projectProposals={proposals.filter(p => p.projectId === project?.id)}
          onSave={editingMilestone
            ? (data) => handleUpdateMilestone(editingMilestone.id, data)
            : handleAddMilestone
          }
          onDelete={editingMilestone ? () => handleDeleteMilestone(editingMilestone.id) : null}
          onClose={() => {
            setShowMilestoneForm(false);
            setEditingMilestone(null);
          }}
        />
      )}
    </div>
  );
}

export default ProjectDetailPage;
