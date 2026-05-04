/**
 * V30: Built-in Proposal Templates for Template Marketplace
 * Rich metadata including ratings, usage stats, categories, and preview data
 */

// Category definitions
export const TEMPLATE_CATEGORIES = {
  AGILE: 'agile',
  PROJECT: 'project',
  PRODUCT: 'product',
  BUG: 'bug',
  RESEARCH: 'research',
  MARKETING: 'marketing',
  INFRASTRUCTURE: 'infrastructure',
  DOCUMENTATION: 'documentation',
};

// Status workflow types
export const WORKFLOW_TYPES = {
  KANBAN: 'kanban',
  Scrum: 'scrum',
  BugFlow: 'bug_flow',
  Review: 'review',
  Simple: 'simple',
};

// Built-in templates with rich metadata
export const BUILTIN_TEMPLATES = [
  {
    id: 'builtin-scrum-agile',
    name: 'Scrum 敏捷开发',
    description: '标准 Scrum 敏捷开发流程，包含冲刺规划、每日站会、评审和回顾环节',
    category: TEMPLATE_CATEGORIES.AGILE,
    workflow: WORKFLOW_TYPES.SCRUM,
    isBuiltin: true,
    rating: 4.8,
    ratingCount: 1247,
    usageCount: 8934,
    author: '系统',
    version: '1.0',
    tags: ['agile', 'scrum', 'sprint', 'development'],
    columns: [
      { id: 'backlog', title: '待办 Backlog', color: 'bg-gray-500' },
      { id: 'sprint', title: '当前迭代 Sprint', color: 'bg-blue-500' },
      { id: 'inProgress', title: '进行中 In Progress', color: 'bg-yellow-500' },
      { id: 'review', title: '评审 Review', color: 'bg-purple-500' },
      { id: 'done', title: '已完成 Done', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'type', 'priority', 'storyPoints', 'sprint', 'assignee'],
      required: ['name', 'type'],
    },
    preview: {
      columns: 5,
      tasks: 12,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-kanban-basic',
    name: '基础看板',
    description: '简单直观的三列看板：待办、进行中、已完成，适合个人任务管理',
    category: TEMPLATE_CATEGORIES.AGILE,
    workflow: WORKFLOW_TYPES.KANBAN,
    isBuiltin: true,
    rating: 4.6,
    ratingCount: 2341,
    usageCount: 15672,
    author: '系统',
    version: '1.0',
    tags: ['kanban', 'simple', 'personal', 'task'],
    columns: [
      { id: 'todo', title: '待办 Todo', color: 'bg-gray-500' },
      { id: 'inProgress', title: '进行中 In Progress', color: 'bg-blue-500' },
      { id: 'done', title: '已完成 Done', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'type'],
      required: ['name'],
    },
    preview: {
      columns: 3,
      tasks: 8,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-product-launch',
    name: '产品发布流程',
    description: '产品从概念到发布的完整流程管理，涵盖规划、开发、测试、发布各阶段',
    category: TEMPLATE_CATEGORIES.PRODUCT,
    workflow: WORKFLOW_TYPES.REVIEW,
    isBuiltin: true,
    rating: 4.7,
    ratingCount: 856,
    usageCount: 4523,
    author: '系统',
    version: '1.0',
    tags: ['product', 'launch', 'release', 'planning'],
    columns: [
      { id: 'concept', title: '概念阶段 Concept', color: 'bg-gray-400' },
      { id: 'planning', title: '规划阶段 Planning', color: 'bg-blue-400' },
      { id: 'development', title: '开发阶段 Development', color: 'bg-yellow-500' },
      { id: 'testing', title: '测试阶段 Testing', color: 'bg-orange-500' },
      { id: 'release', title: '发布阶段 Release', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'type', 'milestone', 'targetDate', 'stakeholders'],
      required: ['name', 'milestone'],
    },
    preview: {
      columns: 5,
      tasks: 15,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-bug-tracking',
    name: 'Bug 追踪管理',
    description: '软件缺陷全生命周期管理，从发现到验证关闭的完整流程',
    category: TEMPLATE_CATEGORIES.BUG,
    workflow: WORKFLOW_TYPES.BUGFLOW,
    isBuiltin: true,
    rating: 4.9,
    ratingCount: 3102,
    usageCount: 21345,
    author: '系统',
    version: '1.0',
    tags: ['bug', 'defect', 'testing', 'qa', 'tracker'],
    columns: [
      { id: 'new', title: '新提交 New', color: 'bg-red-500' },
      { id: 'assigned', title: '已指派 Assigned', color: 'bg-blue-500' },
      { id: 'inProgress', title: '修复中 In Progress', color: 'bg-yellow-500' },
      { id: 'verified', title: '已验证 Verified', color: 'bg-green-500' },
      { id: 'closed', title: '已关闭 Closed', color: 'bg-gray-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'severity', 'priority', 'reporter', 'assignee', 'stepsToReproduce'],
      required: ['name', 'severity', 'priority'],
    },
    preview: {
      columns: 5,
      tasks: 20,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-tech-research',
    name: '技术研究项目',
    description: '技术调研和可行性研究专用模板，包含研究目标、技术方案、风险评估等',
    category: TEMPLATE_CATEGORIES.RESEARCH,
    workflow: WORKFLOW_TYPES.SIMPLE,
    isBuiltin: true,
    rating: 4.5,
    ratingCount: 423,
    usageCount: 1876,
    author: '系统',
    version: '1.0',
    tags: ['research', 'technical', 'spike', 'feasibility'],
    columns: [
      { id: 'topic', title: '选题 Topic', color: 'bg-purple-500' },
      { id: 'researching', title: '研究中 Researching', color: 'bg-blue-500' },
      { id: 'analyzing', title: '分析中 Analyzing', color: 'bg-yellow-500' },
      { id: 'documenting', title: '文档化 Documenting', color: 'bg-orange-500' },
      { id: 'completed', title: '已完成 Completed', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'researcher', 'objectives', 'techStack', 'risks', 'timeline'],
      required: ['name', 'researcher'],
    },
    preview: {
      columns: 5,
      tasks: 6,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-marketing-campaign',
    name: '营销活动管理',
    description: '营销活动和推广项目管理，包含策划、执行、跟踪、复盘全流程',
    category: TEMPLATE_CATEGORIES.MARKETING,
    workflow: WORKFLOW_TYPES.KANBAN,
    isBuiltin: true,
    rating: 4.4,
    ratingCount: 312,
    usageCount: 1234,
    author: '系统',
    version: '1.0',
    tags: ['marketing', 'campaign', 'promotion', 'campaign'],
    columns: [
      { id: 'idea', title: '创意 Idea', color: 'bg-pink-500' },
      { id: 'planning', title: '策划中 Planning', color: 'bg-purple-500' },
      { id: 'preparing', title: '准备中 Preparing', color: 'bg-blue-500' },
      { id: 'running', title: '执行中 Running', color: 'bg-yellow-500' },
      { id: 'completed', title: '已完成 Completed', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'budget', 'channel', 'targetAudience', 'kpis', 'timeline'],
      required: ['name', 'budget'],
    },
    preview: {
      columns: 5,
      tasks: 10,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-infra-ops',
    name: '运维任务管理',
    description: 'IT运维和基础设施任务管理，支持事件、变更、问题三种流程',
    category: TEMPLATE_CATEGORIES.INFRASTRUCTURE,
    workflow: WORKFLOW_TYPES.BUGFLOW,
    isBuiltin: true,
    rating: 4.6,
    ratingCount: 567,
    usageCount: 3421,
    author: '系统',
    version: '1.0',
    tags: ['operations', 'infra', 'devops', 'maintenance', 'incident'],
    columns: [
      { id: 'incident', title: '事件 Incident', color: 'bg-red-500' },
      { id: 'investigating', title: '调查中 Investigating', color: 'bg-orange-500' },
      { id: 'mitigating', title: '处理中 Mitigating', color: 'bg-yellow-500' },
      { id: 'resolved', title: '已解决 Resolved', color: 'bg-blue-500' },
      { id: 'closed', title: '已关闭 Closed', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'severity', 'impact', 'assignee', 'resolution', 'postMortem'],
      required: ['name', 'severity'],
    },
    preview: {
      columns: 5,
      tasks: 8,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-docs-roadmap',
    name: '文档编写计划',
    description: '技术文档编写和知识库建设专用模板，支持多阶段文档审核流程',
    category: TEMPLATE_CATEGORIES.DOCUMENTATION,
    workflow: WORKFLOW_TYPES.REVIEW,
    isBuiltin: true,
    rating: 4.3,
    ratingCount: 198,
    usageCount: 876,
    author: '系统',
    version: '1.0',
    tags: ['documentation', 'docs', 'knowledge', 'wiki', 'writing'],
    columns: [
      { id: 'drafting', title: '起草中 Drafting', color: 'bg-gray-500' },
      { id: 'review', title: '审核中 Review', color: 'bg-yellow-500' },
      { id: 'revision', title: '修订中 Revision', color: 'bg-orange-500' },
      { id: 'approved', title: '已批准 Approved', color: 'bg-blue-500' },
      { id: 'published', title: '已发布 Published', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'author', 'reviewer', 'docType', 'audience'],
      required: ['name', 'author'],
    },
    preview: {
      columns: 5,
      tasks: 5,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-sprint-board',
    name: '两周迭代看板',
    description: '固定两周周期的敏捷迭代看板，适合中小团队快速迭代开发',
    category: TEMPLATE_CATEGORIES.AGILE,
    workflow: WORKFLOW_TYPES.SCRUM,
    isBuiltin: true,
    rating: 4.7,
    ratingCount: 1567,
    usageCount: 9876,
    author: '系统',
    version: '1.0',
    tags: ['sprint', 'bi-weekly', 'iteration', 'agile'],
    columns: [
      { id: 'sprintBacklog', title: '迭代待办 Sprint Backlog', color: 'bg-indigo-500' },
      { id: 'todo', title: '待办 Todo', color: 'bg-gray-500' },
      { id: 'inProgress', title: '进行中 In Progress', color: 'bg-yellow-500' },
      { id: 'inReview', title: '审核中 In Review', color: 'bg-orange-500' },
      { id: 'done', title: '已完成 Done', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'type', 'storyPoints', 'assignee', 'sprintGoal'],
      required: ['name', 'storyPoints'],
    },
    preview: {
      columns: 5,
      tasks: 14,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-feature-tracker',
    name: '功能需求追踪',
    description: '产品功能需求全生命周期管理，从收集到上线的一站式追踪',
    category: TEMPLATE_CATEGORIES.PRODUCT,
    workflow: WORKFLOW_TYPES.KANBAN,
    isBuiltin: true,
    rating: 4.8,
    ratingCount: 2034,
    usageCount: 14567,
    author: '系统',
    version: '1.0',
    tags: ['feature', 'product', 'requirements', 'tracking', 'planning'],
    columns: [
      { id: 'backlog', title: '需求池 Backlog', color: 'bg-gray-500' },
      { id: 'approved', title: '已批准 Approved', color: 'bg-blue-500' },
      { id: 'development', title: '开发中 Development', color: 'bg-yellow-500' },
      { id: 'testing', title: '测试中 Testing', color: 'bg-orange-500' },
      { id: 'released', title: '已发布 Released', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'type', 'priority', 'featureArea', 'targetVersion', 'acceptanceCriteria'],
      required: ['name', 'priority'],
    },
    preview: {
      columns: 5,
      tasks: 18,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-qa-testing',
    name: 'QA 测试管理',
    description: '软件测试和质量保证专用看板，覆盖测试计划、用例管理、缺陷追踪',
    category: TEMPLATE_CATEGORIES.BUG,
    workflow: WORKFLOW_TYPES.BUGFLOW,
    isBuiltin: true,
    rating: 4.6,
    ratingCount: 876,
    usageCount: 5432,
    author: '系统',
    version: '1.0',
    tags: ['qa', 'testing', 'quality', 'test-case', 'regression'],
    columns: [
      { id: 'testPlan', title: '测试计划 Test Plan', color: 'bg-indigo-500' },
      { id: 'testDesign', title: '用例设计 Test Design', color: 'bg-blue-500' },
      { id: 'testExecution', title: '执行中 Execution', color: 'bg-yellow-500' },
      { id: 'bugReport', title: '缺陷报告 Bug Report', color: 'bg-red-500' },
      { id: 'testComplete', title: '测试完成 Complete', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'testType', 'priority', 'tester', 'testData', 'expectedResult'],
      required: ['name', 'testType'],
    },
    preview: {
      columns: 5,
      tasks: 16,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'builtin-event-project',
    name: '活动项目管理',
    description: '线下活动、会议、展会等项目专用模板，支持多任务协调',
    category: TEMPLATE_CATEGORIES.PROJECT,
    workflow: WORKFLOW_TYPES.SIMPLE,
    isBuiltin: true,
    rating: 4.5,
    ratingCount: 432,
    usageCount: 2134,
    author: '系统',
    version: '1.0',
    tags: ['event', 'conference', 'exhibition', 'project', 'coordination'],
    columns: [
      { id: 'preparation', title: '筹备中 Preparation', color: 'bg-purple-500' },
      { id: 'coordination', title: '协调中 Coordination', color: 'bg-blue-500' },
      { id: 'execution', title: '执行中 Execution', color: 'bg-yellow-500' },
      { id: 'onSite', title: '现场执行 On Site', color: 'bg-orange-500' },
      { id: 'wrapUp', title: '收尾 Wrap Up', color: 'bg-green-500' },
    ],
    proposalTemplate: {
      fields: ['name', 'description', 'eventDate', 'venue', 'attendees', 'budget', 'vendor'],
      required: ['name', 'eventDate'],
    },
    preview: {
      columns: 5,
      tasks: 12,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

/**
 * Get all builtin templates
 */
export function getBuiltinTemplates() {
  return BUILTIN_TEMPLATES;
}

/**
 * Get builtin template by ID
 */
export function getBuiltinTemplateById(id) {
  return BUILTIN_TEMPLATES.find(t => t.id === id) || null;
}

/**
 * Get templates by category
 */
export function getBuiltinTemplatesByCategory(category) {
  return BUILTIN_TEMPLATES.filter(t => t.category === category);
}

/**
 * Search builtin templates
 */
export function searchBuiltinTemplates(query) {
  const q = query.toLowerCase();
  return BUILTIN_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

/**
 * Get popular templates (by usage count)
 */
export function getPopularTemplates(limit = 5) {
  return [...BUILTIN_TEMPLATES]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * Get top rated templates
 */
export function getTopRatedTemplates(limit = 5) {
  return [...BUILTIN_TEMPLATES]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

/**
 * Get all unique categories
 */
export function getAllCategories() {
  return Object.values(TEMPLATE_CATEGORIES);
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category) {
  const names = {
    [TEMPLATE_CATEGORIES.AGILE]: '敏捷开发',
    [TEMPLATE_CATEGORIES.PROJECT]: '项目管理',
    [TEMPLATE_CATEGORIES.PRODUCT]: '产品管理',
    [TEMPLATE_CATEGORIES.BUG]: 'Bug追踪',
    [TEMPLATE_CATEGORIES.RESEARCH]: '技术研究',
    [TEMPLATE_CATEGORIES.MARKETING]: '市场营销',
    [TEMPLATE_CATEGORIES.INFRASTRUCTURE]: '运维管理',
    [TEMPLATE_CATEGORIES.DOCUMENTATION]: '文档编写',
  };
  return names[category] || category;
}

export default BUILTIN_TEMPLATES;
