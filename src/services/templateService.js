/**
 * V15: Kanban Board Template Service
 * Manages preset and custom kanban templates with localStorage persistence
 */

const TEMPLATES_KEY = 'kanban_board_templates';

// 4 Preset Templates
export const PRESET_TEMPLATES = [
  {
    id: 'preset-scrum',
    name: 'Scrum 敏捷开发',
    description: '标准的 Scrum 敏捷开发流程看板',
    isPreset: true,
    columns: [
      { id: 'backlog', title: '待办 (Backlog)', color: 'bg-gray-500' },
      { id: 'sprint', title: '当前迭代 (Sprint)', color: 'bg-blue-500' },
      { id: 'inProgress', title: '进行中 (In Progress)', color: 'bg-yellow-500' },
      { id: 'review', title: '评审 (Review)', color: 'bg-purple-500' },
      { id: 'done', title: '已完成 (Done)', color: 'bg-green-500' },
    ],
    tasks: [],
  },
  {
    id: 'preset-kanban-basic',
    name: '基础看板',
    description: '简单直观的三列看板：待办、进行中、已完成',
    isPreset: true,
    columns: [
      { id: 'todo', title: '待办 (Todo)', color: 'bg-gray-500' },
      { id: 'inProgress', title: '进行中 (In Progress)', color: 'bg-blue-500' },
      { id: 'done', title: '已完成 (Done)', color: 'bg-green-500' },
    ],
    tasks: [],
  },
  {
    id: 'preset-product-launch',
    name: '产品发布流程',
    description: '产品从概念到发布的完整流程管理',
    isPreset: true,
    columns: [
      { id: 'concept', title: '概念阶段 (Concept)', color: 'bg-gray-400' },
      { id: 'planning', title: '规划阶段 (Planning)', color: 'bg-blue-400' },
      { id: 'development', title: '开发阶段 (Development)', color: 'bg-yellow-500' },
      { id: 'testing', title: '测试阶段 (Testing)', color: 'bg-orange-500' },
      { id: 'release', title: '发布阶段 (Release)', color: 'bg-green-500' },
    ],
    tasks: [],
  },
  {
    id: 'preset-bug-tracking',
    name: 'Bug 追踪管理',
    description: '软件缺陷全生命周期管理看板',
    isPreset: true,
    columns: [
      { id: 'new', title: '新提交 (New)', color: 'bg-red-500' },
      { id: 'assigned', title: '已指派 (Assigned)', color: 'bg-blue-500' },
      { id: 'inProgress', title: '修复中 (In Progress)', color: 'bg-yellow-500' },
      { id: 'verified', title: '已验证 (Verified)', color: 'bg-green-500' },
      { id: 'closed', title: '已关闭 (Closed)', color: 'bg-gray-500' },
    ],
    tasks: [],
  },
];

/**
 * Get all templates (presets + custom from localStorage)
 */
export function getTemplates() {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    const customTemplates = stored ? JSON.parse(stored) : [];
    return [...PRESET_TEMPLATES, ...customTemplates];
  } catch (e) {
    console.error('Failed to load templates:', e);
    return [...PRESET_TEMPLATES];
  }
}

/**
 * Get template by ID
 */
export function getTemplateById(id) {
  const templates = getTemplates();
  return templates.find(t => t.id === id) || null;
}

/**
 * Save a custom template
 * @param {string} name - Template name
 * @param {string} description - Template description
 * @param {Array} columns - Column configuration
 * @param {Array} tasks - Initial tasks (optional)
 * @returns {Object} - { success, template, templates }
 */
export function saveTemplate(name, description, columns, tasks = []) {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    const customTemplates = stored ? JSON.parse(stored) : [];

    const newTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: description || '',
      isPreset: false,
      columns,
      tasks,
      createdAt: new Date().toISOString(),
    };

    customTemplates.push(newTemplate);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customTemplates));

    return {
      success: true,
      template: newTemplate,
      templates: [...PRESET_TEMPLATES, ...customTemplates],
    };
  } catch (e) {
    console.error('Failed to save template:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Update a custom template
 * @param {string} id - Template ID
 * @param {Object} updates - Fields to update
 * @returns {Object} - { success, template, templates }
 */
export function updateTemplate(id, updates) {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    const customTemplates = stored ? JSON.parse(stored) : [];

    const index = customTemplates.findIndex(t => t.id === id);
    if (index === -1) {
      return { success: false, error: 'Template not found' };
    }

    // Cannot update preset templates
    if (customTemplates[index].isPreset) {
      return { success: false, error: 'Cannot update preset templates' };
    }

    customTemplates[index] = {
      ...customTemplates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customTemplates));

    return {
      success: true,
      template: customTemplates[index],
      templates: [...PRESET_TEMPLATES, ...customTemplates],
    };
  } catch (e) {
    console.error('Failed to update template:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a custom template
 * @param {string} id - Template ID
 * @returns {Object} - { success, templates }
 */
export function deleteTemplate(id) {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    const customTemplates = stored ? JSON.parse(stored) : [];

    const template = customTemplates.find(t => t.id === id);
    if (template?.isPreset) {
      return { success: false, error: 'Cannot delete preset templates' };
    }

    const filtered = customTemplates.filter(t => t.id !== id);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));

    return {
      success: true,
      templates: [...PRESET_TEMPLATES, ...filtered],
    };
  } catch (e) {
    console.error('Failed to delete template:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Get current board configuration as a template
 * @param {string} name - Template name
 * @param {string} description - Template description
 * @param {Array} columns - Current columns
 * @param {Array} tasks - Current tasks
 */
export function saveCurrentBoardAsTemplate(name, description, columns, tasks) {
  return saveTemplate(name, description, columns, tasks);
}

export default {
  getTemplates,
  getTemplateById,
  saveTemplate,
  updateTemplate,
  deleteTemplate,
  saveCurrentBoardAsTemplate,
  PRESET_TEMPLATES,
};
