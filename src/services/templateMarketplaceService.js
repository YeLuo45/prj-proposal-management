/**
 * V30: Template Marketplace Service
 * Manages template marketplace including builtin, custom, imported/exported templates
 * Handles ratings, favorites, usage tracking, and import/export
 */

import { BUILTIN_TEMPLATES, getBuiltinTemplateById, searchBuiltinTemplates } from '../data/builtinTemplates';

const MARKETPLACE_KEY = 'template_marketplace';
const CUSTOM_TEMPLATES_KEY = 'custom_marketplace_templates';
const FAVORITES_KEY = 'template_favorites';
const USER_RATINGS_KEY = 'template_user_ratings';
const USAGE_STATS_KEY = 'template_usage_stats';
const COMMENTS_KEY = 'template_comments';

/**
 * Get all templates (builtin + custom)
 */
export function getAllTemplates() {
  const custom = getCustomTemplates();
  return [...BUILTIN_TEMPLATES, ...custom];
}

/**
 * Get all builtin templates
 */
export function getBuiltinTemplates() {
  return BUILTIN_TEMPLATES;
}

/**
 * Get custom user-created marketplace templates
 */
export function getCustomTemplates() {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load custom templates:', e);
    return [];
  }
}

/**
 * Get template by ID (searches both builtin and custom)
 */
export function getTemplateById(id) {
  // Check builtin first
  const builtin = getBuiltinTemplateById(id);
  if (builtin) return builtin;
  
  // Check custom
  const custom = getCustomTemplates();
  return custom.find(t => t.id === id) || null;
}

/**
 * Search templates across builtin and custom
 */
export function searchTemplates(query, filters = {}) {
  const { category, workflow, tags } = filters;
  
  let results = [...BUILTIN_TEMPLATES, ...getCustomTemplates()];
  
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags?.some(tag => tag.toLowerCase().includes(q))
    );
  }
  
  if (category) {
    results = results.filter(t => t.category === category);
  }
  
  if (workflow) {
    results = results.filter(t => t.workflow === workflow);
  }
  
  if (tags && tags.length > 0) {
    results = results.filter(t => tags.some(tag => t.tags?.includes(tag)));
  }
  
  return results;
}

/**
 * Save a custom template to marketplace
 */
export function saveCustomTemplate(templateData) {
  try {
    const custom = getCustomTemplates();
    
    const newTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category || 'agile',
      workflow: templateData.workflow || 'kanban',
      isBuiltin: false,
      isCustom: true,
      columns: templateData.columns || [],
      proposalTemplate: templateData.proposalTemplate || { fields: [], required: [] },
      tags: templateData.tags || [],
      author: '用户',
      version: '1.0',
      rating: 0,
      ratingCount: 0,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    custom.push(newTemplate);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(custom));
    
    return { success: true, template: newTemplate };
  } catch (e) {
    console.error('Failed to save custom template:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Update a custom template
 */
export function updateCustomTemplate(id, updates) {
  try {
    const custom = getCustomTemplates();
    const index = custom.findIndex(t => t.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Template not found' };
    }
    
    if (custom[index].isBuiltin) {
      return { success: false, error: 'Cannot update builtin templates' };
    }
    
    custom[index] = {
      ...custom[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(custom));
    return { success: true, template: custom[index] };
  } catch (e) {
    console.error('Failed to update custom template:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete a custom template
 */
export function deleteCustomTemplate(id) {
  try {
    const custom = getCustomTemplates();
    const template = custom.find(t => t.id === id);
    
    if (template?.isBuiltin) {
      return { success: false, error: 'Cannot delete builtin templates' };
    }
    
    const filtered = custom.filter(t => t.id !== id);
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(filtered));
    
    // Remove from favorites if present
    const favorites = getFavorites();
    if (favorites.includes(id)) {
      const newFavorites = favorites.filter(f => f !== id);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    }
    
    return { success: true };
  } catch (e) {
    console.error('Failed to delete custom template:', e);
    return { success: false, error: e.message };
  }
}

// ============ Ratings ============

/**
 * Get user's ratings
 */
export function getUserRatings() {
  try {
    const stored = localStorage.getItem(USER_RATINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Rate a template
 */
export function rateTemplate(templateId, rating) {
  try {
    const userRatings = getUserRatings();
    const template = getTemplateById(templateId);
    
    if (!template) {
      return { success: false, error: 'Template not found' };
    }
    
    const previousRating = userRatings[templateId];
    userRatings[templateId] = rating;
    localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(userRatings));
    
    // Update template's aggregate rating (simplified)
    const usageStats = getUsageStats();
    if (!usageStats[templateId]) {
      usageStats[templateId] = { totalRating: 0, count: 0 };
    }
    
    if (previousRating !== undefined) {
      // Replace previous rating
      usageStats[templateId].totalRating = usageStats[templateId].totalRating - previousRating + rating;
    } else {
      // New rating
      usageStats[templateId].totalRating += rating;
      usageStats[templateId].count += 1;
    }
    
    localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(usageStats));
    
    return { success: true, newRating: calculateAverageRating(templateId) };
  } catch (e) {
    console.error('Failed to rate template:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Get user's rating for a template
 */
export function getUserRating(templateId) {
  const userRatings = getUserRatings();
  return userRatings[templateId] || null;
}

/**
 * Calculate average rating for a template
 */
function calculateAverageRating(templateId) {
  const usageStats = getUsageStats();
  const stats = usageStats[templateId];
  
  if (!stats || stats.count === 0) {
    const template = getTemplateById(templateId);
    return template?.rating || 0;
  }
  
  return Math.round((stats.totalRating / stats.count) * 10) / 10;
}

// ============ Comments ============

/**
 * Get all comments for a template
 */
export function getComments(templateId) {
  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    const allComments = stored ? JSON.parse(stored) : {};
    return allComments[templateId] || [];
  } catch (e) {
    return [];
  }
}

/**
 * Add a comment to a template
 */
export function addComment(templateId, text, rating = null) {
  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    const allComments = stored ? JSON.parse(stored) : {};
    
    if (!allComments[templateId]) {
      allComments[templateId] = [];
    }
    
    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: text.trim(),
      rating,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    allComments[templateId].unshift(comment); // newest first
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    
    // If rating is provided, also update the template rating
    if (rating !== null) {
      rateTemplate(templateId, rating);
    }
    
    return { success: true, comment };
  } catch (e) {
    console.error('Failed to add comment:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Update a comment
 */
export function updateComment(templateId, commentId, text) {
  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    const allComments = stored ? JSON.parse(stored) : {};
    
    if (!allComments[templateId]) {
      return { success: false, error: 'Template not found' };
    }
    
    const commentIndex = allComments[templateId].findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return { success: false, error: 'Comment not found' };
    }
    
    allComments[templateId][commentIndex] = {
      ...allComments[templateId][commentIndex],
      text: text.trim(),
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    return { success: true, comment: allComments[templateId][commentIndex] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Delete a comment
 */
export function deleteComment(templateId, commentId) {
  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    const allComments = stored ? JSON.parse(stored) : {};
    
    if (!allComments[templateId]) {
      return { success: false, error: 'Template not found' };
    }
    
    allComments[templateId] = allComments[templateId].filter(c => c.id !== commentId);
    
    if (allComments[templateId].length === 0) {
      delete allComments[templateId];
    }
    
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Get total comment count for a template
 */
export function getCommentCount(templateId) {
  return getComments(templateId).length;
}

// ============ Favorites ============

/**
 * Get favorite template IDs
 */
export function getFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Add template to favorites
 */
export function addToFavorites(templateId) {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(templateId)) {
      favorites.push(templateId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
    return { success: true, favorites };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Remove template from favorites
 */
export function removeFromFavorites(templateId) {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(f => f !== templateId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return { success: true, favorites: filtered };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(templateId) {
  const favorites = getFavorites();
  if (favorites.includes(templateId)) {
    return removeFromFavorites(templateId);
  } else {
    return addToFavorites(templateId);
  }
}

/**
 * Check if template is favorited
 */
export function isFavorite(templateId) {
  return getFavorites().includes(templateId);
}

// ============ Usage Tracking ============

/**
 * Get usage statistics
 */
export function getUsageStats() {
  try {
    const stored = localStorage.getItem(USAGE_STATS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Record template usage (when user applies a template)
 */
export function recordTemplateUsage(templateId) {
  try {
    const stats = getUsageStats();
    if (!stats[templateId]) {
      stats[templateId] = { totalRating: 0, count: 0, usageCount: 0 };
    }
    stats[templateId].usageCount = (stats[templateId].usageCount || 0) + 1;
    localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============ Import/Export ============

/**
 * Export template to JSON format
 */
export function exportTemplate(templateId) {
  const template = getTemplateById(templateId);
  if (!template) {
    return { success: false, error: 'Template not found' };
  }
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    template: {
      name: template.name,
      description: template.description,
      category: template.category,
      workflow: template.workflow,
      columns: template.columns,
      proposalTemplate: template.proposalTemplate,
      tags: template.tags,
    },
  };
  
  return { success: true, data: exportData };
}

/**
 * Export multiple templates
 */
export function exportTemplates(templateIds) {
  const templates = [];
  const errors = [];
  
  for (const id of templateIds) {
    const result = exportTemplate(id);
    if (result.success) {
      templates.push(result.data.template);
    } else {
      errors.push({ id, error: result.error });
    }
  }
  
  return {
    success: errors.length === 0,
    data: {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      templates,
    },
    errors,
  };
}

/**
 * Export all templates (for backup)
 */
export function exportAllTemplates() {
  const custom = getCustomTemplates();
  const favorites = getFavorites();
  const userRatings = getUserRatings();
  const usageStats = getUsageStats();
  
  return {
    success: true,
    data: {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      templates: custom,
      favorites,
      userRatings,
      usageStats,
    },
  };
}

/**
 * Import template from JSON
 */
export function importTemplate(importData) {
  try {
    // Validate format
    if (!importData.template) {
      return { success: false, error: 'Invalid template format' };
    }
    
    const t = importData.template;
    
    if (!t.name || !t.columns) {
      return { success: false, error: 'Missing required fields: name, columns' };
    }
    
    // Check if it's a builtin (by name matching)
    const builtin = BUILTIN_TEMPLATES.find(bt => bt.name === t.name);
    if (builtin) {
      return { success: false, error: 'Cannot overwrite builtin template' };
    }
    
    // Create new custom template
    const result = saveCustomTemplate({
      name: t.name,
      description: t.description || '',
      category: t.category || 'agile',
      workflow: t.workflow || 'kanban',
      columns: t.columns,
      proposalTemplate: t.proposalTemplate || { fields: [], required: [] },
      tags: t.tags || [],
    });
    
    return result;
  } catch (e) {
    console.error('Failed to import template:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Import templates from bulk export file
 */
export function importTemplatesBulk(importData) {
  try {
    const results = {
      imported: [],
      skipped: [],
      errors: [],
    };
    
    // Handle single template export format
    if (importData.template) {
      const result = importTemplate(importData);
      if (result.success) {
        results.imported.push(result.template);
      } else {
        results.errors.push({ template: importData.template?.name, error: result.error });
      }
      return results;
    }
    
    // Handle bulk template export format
    if (Array.isArray(importData.templates)) {
      for (const t of importData.templates) {
        const result = importTemplate({ template: t });
        if (result.success) {
          results.imported.push(result.template);
        } else {
          results.skipped.push({ name: t.name, error: result.error });
        }
      }
    }
    
    // Handle full backup format with favorites/ratings
    if (importData.templates && importData.favorites) {
      // Import templates
      for (const t of importData.templates) {
        const result = importTemplate({ template: t });
        if (result.success) {
          results.imported.push(result.template);
        } else {
          results.skipped.push({ name: t.name, error: result.error });
        }
      }
      
      // Merge favorites
      if (Array.isArray(importData.favorites)) {
        const currentFavorites = getFavorites();
        const newFavorites = [...new Set([...currentFavorites, ...importData.favorites])];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      }
      
      // Merge user ratings
      if (importData.userRatings) {
        const currentRatings = getUserRatings();
        const mergedRatings = { ...currentRatings, ...importData.userRatings };
        localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(mergedRatings));
      }
    }
    
    return results;
  } catch (e) {
    console.error('Failed to import templates bulk:', e);
    return { imported: [], skipped: [], errors: [{ error: e.message }] };
  }
}

/**
 * Download template as JSON file
 */
export function downloadTemplate(templateId, filename) {
  const result = exportTemplate(templateId);
  if (!result.success) return result;
  
  const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${result.data.template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { success: true };
}

/**
 * Download multiple templates as JSON file
 */
export function downloadTemplates(templateIds, filename = 'templates.json') {
  const result = exportTemplates(templateIds);
  if (!result.data?.templates?.length) {
    return { success: false, error: 'No templates to export' };
  }
  
  const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return { success: true, count: result.data.templates.length };
}

/**
 * Read file and parse as template JSON
 */
export function parseTemplateFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ============ Statistics ============

/**
 * Get marketplace statistics
 */
export function getMarketplaceStats() {
  const custom = getCustomTemplates();
  const favorites = getFavorites();
  const userRatings = getUserRatings();
  const usageStats = getUsageStats();
  
  return {
    totalTemplates: BUILTIN_TEMPLATES.length + custom.length,
    builtinCount: BUILTIN_TEMPLATES.length,
    customCount: custom.length,
    favoritesCount: favorites.length,
    ratedCount: Object.keys(userRatings).length,
    totalUsage: Object.values(usageStats).reduce((sum, s) => sum + (s.usageCount || 0), 0),
  };
}

export default {
  getAllTemplates,
  getBuiltinTemplates,
  getCustomTemplates,
  getTemplateById,
  searchTemplates,
  saveCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  getUserRatings,
  rateTemplate,
  getUserRating,
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  isFavorite,
  recordTemplateUsage,
  exportTemplate,
  exportTemplates,
  exportAllTemplates,
  importTemplate,
  importTemplatesBulk,
  downloadTemplate,
  downloadTemplates,
  parseTemplateFile,
  getMarketplaceStats,
  // Comments
  getComments,
  addComment,
  updateComment,
  deleteComment,
  getCommentCount,
};
