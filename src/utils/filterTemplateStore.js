const KEY = 'filter_templates';
const MAX_TEMPLATES = 10;

function getTemplates() {
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to get filter templates:', e);
    return [];
  }
}

function saveTemplate(name, filters) {
  try {
    const templates = getTemplates();
    if (templates.length >= MAX_TEMPLATES) {
      return { error: `最多保存 ${MAX_TEMPLATES} 个筛选模板` };
    }
    const id = `template-${Date.now()}`;
    const newTemplate = { id, name, filters };
    const updated = [...templates, newTemplate];
    localStorage.setItem(KEY, JSON.stringify(updated));
    return { templates: updated };
  } catch (e) {
    console.error('Failed to save filter template:', e);
    return { error: '保存失败' };
  }
}

function deleteTemplate(id) {
  try {
    const templates = getTemplates();
    const updated = templates.filter(t => t.id !== id);
    localStorage.setItem(KEY, JSON.stringify(updated));
    return { templates: updated };
  } catch (e) {
    console.error('Failed to delete filter template:', e);
    return { error: '删除失败' };
  }
}

export { getTemplates, saveTemplate, deleteTemplate, MAX_TEMPLATES, KEY };
